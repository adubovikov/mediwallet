import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUserSettings } from '@/services/database';
import { DesignSystem, getThemeColors } from '@/constants/design';

// Liste der größten Krankenversicherungen (alphabetisch sortiert)
const INSURANCE_COMPANIES = [
  'AOK',
  'Allianz Private Krankenversicherung',
  'AXA Private Krankenversicherung',
  'Barmenia Private Krankenversicherung',
  'Barmer',
  'BKK',
  'Central Krankenversicherung',
  'DAK-Gesundheit',
  'Debeka Private Krankenversicherung',
  'DKV Deutsche Krankenversicherung',
  'HanseMerkur Krankenversicherung',
  'HEK - Hanseatische Krankenkasse',
  'hkk Krankenkasse',
  'HUK-COBURG Private Krankenversicherung',
  'IKK classic',
  'KKH Kaufmännische Krankenkasse',
  'Knappschaft',
  'LKK - Landwirtschaftliche Krankenkasse',
  'Signal Iduna Private Krankenversicherung',
  'Techniker Krankenkasse (TK)',
  'Andere',
].sort();

export default function PersonalInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string; testType?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  const themeColors = getThemeColors(isDark);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userDateOfBirth, setUserDateOfBirth] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorAddress, setDoctorAddress] = useState('');
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  // Berechnet die Anzahl der Tage im ausgewählten Monat
  const getDaysInMonth = (month: number, year: number): number => {
    if (month === 2) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return isLeapYear ? 29 : 28;
    }
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
      return 31;
    }
    return 30;
  };

  // Aktualisiert den Tag, wenn der Monat oder das Jahr geändert wird
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    const maxDays = getDaysInMonth(month, selectedYear);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const maxDays = getDaysInMonth(selectedMonth, year);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  };

  // Öffnet Maps-App mit Adresse oder aktueller Position
  const openMapsForAddress = async (addressType: 'user' | 'doctor') => {
    if (isWeb) {
      Alert.alert(
        'Web-Vorschau',
        'Kartenfunktion ist auf Web nicht verfügbar. Bitte verwenden Sie iOS oder Android.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Berechtigung erforderlich',
          'Standortberechtigung ist erforderlich, um Ihre Position zu verwenden.',
          [{ text: 'OK' }]
        );
      }

      Alert.alert(
        'Adresse auswählen',
        'Wie möchten Sie die Adresse auswählen?',
        [
          {
            text: 'Aktuelle Position',
            onPress: async () => {
              try {
                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;
                
                const url = Platform.select({
                  ios: `maps://maps.apple.com/?ll=${latitude},${longitude}`,
                  android: `geo:${latitude},${longitude}`,
                  default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
                });
                
                await Linking.openURL(url);
              } catch (error) {
                console.error('Error getting location:', error);
                Alert.alert('Fehler', 'Standort konnte nicht ermittelt werden.');
              }
            },
          },
          {
            text: 'Adresse eingeben',
            onPress: () => {
              // Adresse wird im TextInput eingegeben
            },
          },
          {
            text: 'Abbrechen',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  const loadUserSettings = async () => {
    try {
      const settings = await getUserSettings();
      if (settings) {
        setUserId(settings.userId || '');
        setUserName(settings.userName || '');
        setUserPhone(settings.userPhone || '');
        setUserEmail(settings.userEmail || '');
        setUserAddress(settings.userAddress || '');
        setUserDateOfBirth(settings.userDateOfBirth || '');
        if (settings.userDateOfBirth) {
          const parsedDate = new Date(settings.userDateOfBirth);
          if (!isNaN(parsedDate.getTime())) {
            setDateOfBirth(parsedDate);
            setSelectedDay(parsedDate.getDate());
            setSelectedMonth(parsedDate.getMonth() + 1);
            setSelectedYear(parsedDate.getFullYear());
          }
        }
        setInsuranceCompany(settings.insuranceCompany || '');
        setInsuranceNumber(settings.insuranceNumber || '');
        setDoctorName(settings.doctorName || '');
        setDoctorPhone(settings.doctorPhone || '');
        setDoctorEmail(settings.doctorEmail || '');
        setDoctorAddress(settings.doctorAddress || '');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie Ihren Namen ein.');
      return;
    }

    if (!insuranceCompany) {
      Alert.alert('Fehler', 'Bitte wählen Sie eine Krankenversicherung aus.');
      return;
    }

    if (!doctorName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie den Namen Ihres Hausarztes ein.');
      return;
    }

    try {
      // Persönliche Informationen in Einstellungen speichern
      const { getUserSettings, saveUserSettings } = await import('@/services/database');
      const existingSettings = await getUserSettings();
      
      const dateOfBirthString = dateOfBirth
        ? dateOfBirth.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : userDateOfBirth || '';
      
      if (existingSettings) {
        await saveUserSettings({
          ...existingSettings,
          userName,
          userPhone,
          userEmail,
          userAddress,
          userDateOfBirth: dateOfBirthString,
          insuranceCompany,
          insuranceNumber,
          doctorName,
          doctorPhone,
          doctorEmail,
          doctorAddress,
        });
      } else {
        await saveUserSettings({
          userName,
          userPhone,
          userEmail,
          userAddress,
          userDateOfBirth: dateOfBirthString,
          insuranceCompany,
          insuranceNumber,
          doctorName,
          doctorPhone,
          doctorEmail,
          doctorAddress,
        });
      }

      // Testergebnis speichern, falls Bild vorhanden
      if (params.imageUri && params.testType) {
        const { initDatabase, addTestResult } = await import('@/services/database');
        await initDatabase();
        
        const testId = await addTestResult({
          testType: params.testType,
          imagePath: params.imageUri,
          notes: `Gescannt von Kamera/Galerie\nName: ${userName}\nTelefon: ${userPhone || 'N/A'}\nE-Mail: ${userEmail || 'N/A'}\nAdresse: ${userAddress || 'N/A'}\nGeburtsdatum: ${dateOfBirthString || 'N/A'}\nKrankenversicherung: ${insuranceCompany}\nVersicherungsnummer: ${insuranceNumber || 'N/A'}\nHausarzt: ${doctorName}\nArzt Telefon: ${doctorPhone || 'N/A'}\nArzt E-Mail: ${doctorEmail || 'N/A'}\nArzt Adresse: ${doctorAddress || 'N/A'}`,
        });

        Alert.alert(
          'Erfolg',
          `Testergebnis wurde erfolgreich gespeichert!\nTyp: ${params.testType}\nID: ${testId}`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/test-results');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Erfolg',
          'Persönliche Informationen wurden gespeichert.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      Alert.alert('Fehler', `Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Persönliche Informationen' }} />
        <View style={styles.loadingContainer}>
          <ThemedText>Lade...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Persönliche Informationen',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
            Persönliche Informationen
          </ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: themeColors.textSecondary }]}>
            Bitte geben Sie Ihre persönlichen Informationen ein, bevor das Testergebnis gespeichert wird.
          </ThemedText>
        </View>

        {/* Benutzer-ID Anzeige */}
        {userId && (
          <View style={[styles.userIdContainer, { backgroundColor: themeColors.surfaceElevated }]}>
            <View style={styles.userIdHeader}>
              <Ionicons name="id-card-outline" size={20} color={DesignSystem.colors.primary.main} />
              <ThemedText style={[styles.userIdLabel, { color: themeColors.text }]}>
                Ihre Benutzer-ID
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.userIdBox, { backgroundColor: themeColors.surface }]}
              onPress={async () => {
                // Kopiere die ID in die Zwischenablage
                try {
                  if (Platform.OS === 'web') {
                    // Für Web
                    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                      await navigator.clipboard.writeText(userId);
                      Alert.alert('Kopiert', 'Benutzer-ID wurde in die Zwischenablage kopiert.');
                    } else if (typeof document !== 'undefined') {
                      // Fallback für ältere Browser
                      const textArea = document.createElement('textarea');
                      textArea.value = userId;
                      textArea.style.position = 'fixed';
                      textArea.style.opacity = '0';
                      textArea.style.left = '-9999px';
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      try {
                        const successful = document.execCommand('copy');
                        if (successful) {
                          Alert.alert('Kopiert', 'Benutzer-ID wurde in die Zwischenablage kopiert.');
                        } else {
                          Alert.alert('Info', `Ihre Benutzer-ID: ${userId}\n\nBitte kopieren Sie die ID manuell.`);
                        }
                      } catch (err) {
                        Alert.alert('Info', `Ihre Benutzer-ID: ${userId}\n\nBitte kopieren Sie die ID manuell.`);
                      }
                      document.body.removeChild(textArea);
                    } else {
                      Alert.alert('Info', `Ihre Benutzer-ID: ${userId}\n\nBitte kopieren Sie die ID manuell.`);
                    }
                  } else {
                    // Für React Native - verwende expo-clipboard
                    await Clipboard.setStringAsync(userId);
                    Alert.alert('Kopiert', 'Benutzer-ID wurde in die Zwischenablage kopiert.');
                  }
                } catch (error) {
                  console.error('Error copying to clipboard:', error);
                  // Fallback: Zeige die ID an
                  Alert.alert('Ihre Benutzer-ID', userId, [
                    { text: 'OK' },
                  ]);
                }
              }}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.userIdText, { color: themeColors.text }]} selectable>
                {userId}
              </ThemedText>
              <Ionicons name="copy-outline" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
            <ThemedText style={[styles.userIdHelp, { color: themeColors.textSecondary }]}>
              Teilen Sie diese ID mit anderen Nutzern, um mit Ihnen zu chatten
            </ThemedText>
          </View>
        )}

        <View style={styles.form}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              Name *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={userName}
              onChangeText={setUserName}
              placeholder="Ihr Name"
              placeholderTextColor={isDark ? '#888' : '#999'}
              autoCapitalize="words"
            />
          </View>

          {/* Krankenversicherung */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              Krankenversicherung *
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.selectButton,
                isDark && styles.selectButtonDark,
                { backgroundColor: themeColors.surface },
              ]}
              onPress={() => setShowInsuranceModal(true)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.selectButtonText,
                  { color: insuranceCompany ? themeColors.text : themeColors.textSecondary },
                ]}
              >
                {insuranceCompany || 'Krankenversicherung auswählen'}
              </ThemedText>
              <Ionicons
                name="chevron-down"
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Telefonnummer */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              Telefonnummer
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={userPhone}
              onChangeText={setUserPhone}
              placeholder="Ihre Telefonnummer"
              placeholderTextColor={isDark ? '#888' : '#999'}
              keyboardType="phone-pad"
            />
          </View>

          {/* E-Mail */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              E-Mail
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={userEmail}
              onChangeText={setUserEmail}
              placeholder="Ihre E-Mail-Adresse"
              placeholderTextColor={isDark ? '#888' : '#999'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Adresse */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: themeColors.text }]}>
                Adresse
              </ThemedText>
              <TouchableOpacity
                onPress={() => openMapsForAddress('user')}
                disabled={isWeb}
                style={styles.mapButton}
              >
                <Ionicons name="map-outline" size={20} color={isWeb ? '#999' : DesignSystem.colors.primary.main} />
                <ThemedText style={[styles.mapButtonText, { color: isWeb ? '#999' : DesignSystem.colors.primary.main }]}>
                  Auf Karte auswählen
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={userAddress}
              onChangeText={setUserAddress}
              placeholder="Ihre Adresse"
              placeholderTextColor={isDark ? '#888' : '#999'}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Geburtsdatum */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              Geburtsdatum
            </ThemedText>
            <TouchableOpacity
              onPress={() => !isWeb && setShowDatePicker(true)}
              disabled={isWeb}
              style={[
                styles.dateInput,
                isDark && styles.inputDark,
                isWeb && styles.disabledInput,
              ]}
            >
              <ThemedText
                style={[
                  styles.dateText,
                  !dateOfBirth && !userDateOfBirth && styles.placeholderText,
                  { color: isDark ? (dateOfBirth || userDateOfBirth ? '#fff' : '#888') : (dateOfBirth || userDateOfBirth ? '#000' : '#999') },
                ]}
              >
                {dateOfBirth
                  ? dateOfBirth.toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : userDateOfBirth || 'TT.MM.JJJJ'}
              </ThemedText>
              <Ionicons name="calendar-outline" size={20} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
          </View>

          {/* Versicherungsnummer */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              Versicherungsnummer
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={insuranceNumber}
              onChangeText={setInsuranceNumber}
              placeholder="Ihre Versicherungsnummer"
              placeholderTextColor={isDark ? '#888' : '#999'}
            />
          </View>

          {/* Hausarzt */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              Hausarzt *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Name des Hausarztes"
              placeholderTextColor={isDark ? '#888' : '#999'}
              autoCapitalize="words"
            />
          </View>

          {/* Arzt Telefonnummer */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              Arzt Telefonnummer
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={doctorPhone}
              onChangeText={setDoctorPhone}
              placeholder="Telefonnummer des Hausarztes"
              placeholderTextColor={isDark ? '#888' : '#999'}
              keyboardType="phone-pad"
            />
          </View>

          {/* Arzt E-Mail */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: themeColors.text }]}>
              Arzt E-Mail
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={doctorEmail}
              onChangeText={setDoctorEmail}
              placeholder="E-Mail-Adresse des Hausarztes"
              placeholderTextColor={isDark ? '#888' : '#999'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Arzt Adresse */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: themeColors.text }]}>
                Arzt Adresse
              </ThemedText>
              <TouchableOpacity
                onPress={() => openMapsForAddress('doctor')}
                disabled={isWeb}
                style={styles.mapButton}
              >
                <Ionicons name="map-outline" size={20} color={isWeb ? '#999' : DesignSystem.colors.primary.main} />
                <ThemedText style={[styles.mapButtonText, { color: isWeb ? '#999' : DesignSystem.colors.primary.main }]}>
                  Auf Karte auswählen
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                isDark && styles.inputDark,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={doctorAddress}
              onChangeText={setDoctorAddress}
              placeholder="Adresse des Hausarztes"
              placeholderTextColor={isDark ? '#888' : '#999'}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Speichern-Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: DesignSystem.colors.primary.main },
          ]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <ThemedText style={styles.saveButtonText}>Speichern und fortfahren</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Krankenversicherung Modal */}
      <Modal
        visible={showInsuranceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInsuranceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: themeColors.text }]}>
                Krankenversicherung auswählen
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowInsuranceModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {INSURANCE_COMPANIES.map((company) => (
                <TouchableOpacity
                  key={company}
                  style={[
                    styles.insuranceOption,
                    insuranceCompany === company && {
                      backgroundColor: DesignSystem.colors.primary.main + '20',
                    },
                  ]}
                  onPress={() => {
                    setInsuranceCompany(company);
                    setShowInsuranceModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.insuranceOptionText,
                      {
                        color:
                          insuranceCompany === company
                            ? DesignSystem.colors.primary.main
                            : themeColors.text,
                        fontWeight:
                          insuranceCompany === company
                            ? DesignSystem.typography.fontWeight.semibold
                            : DesignSystem.typography.fontWeight.normal,
                      },
                    ]}
                  >
                    {company}
                  </ThemedText>
                  {insuranceCompany === company && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={DesignSystem.colors.primary.main}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Geburtsdatum Picker Modal */}
      {showDatePicker && !isWeb && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.surfaceElevated }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={[styles.modalTitle, { color: themeColors.text }]}>
                  Geburtsdatum auswählen
                </ThemedText>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color={themeColors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerContainer}>
                <View style={styles.pickerColumn}>
                  <ThemedText style={[styles.pickerLabel, { color: themeColors.text }]}>Tag</ThemedText>
                  <ScrollView style={styles.pickerScrollView}>
                    {Array.from(
                      { length: getDaysInMonth(selectedMonth, selectedYear) },
                      (_, i) => i + 1
                    ).map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.pickerItem,
                          selectedDay === day && styles.pickerItemSelected,
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <ThemedText
                          style={[
                            styles.pickerItemText,
                            selectedDay === day && styles.pickerItemTextSelected,
                            { color: themeColors.text },
                          ]}
                        >
                          {day.toString().padStart(2, '0')}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.pickerColumn}>
                  <ThemedText style={[styles.pickerLabel, { color: themeColors.text }]}>Monat</ThemedText>
                  <ScrollView style={styles.pickerScrollView}>
                    {[
                      'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
                    ].map((month, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.pickerItem,
                          selectedMonth === index + 1 && styles.pickerItemSelected,
                        ]}
                        onPress={() => handleMonthChange(index + 1)}
                      >
                        <ThemedText
                          style={[
                            styles.pickerItemText,
                            selectedMonth === index + 1 && styles.pickerItemTextSelected,
                            { color: themeColors.text },
                          ]}
                        >
                          {month}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.pickerColumn}>
                  <ThemedText style={[styles.pickerLabel, { color: themeColors.text }]}>Jahr</ThemedText>
                  <ScrollView style={styles.pickerScrollView}>
                    {Array.from(
                      { length: new Date().getFullYear() - 1900 + 1 },
                      (_, i) => new Date().getFullYear() - i
                    ).map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.pickerItem,
                          selectedYear === year && styles.pickerItemSelected,
                        ]}
                        onPress={() => handleYearChange(year)}
                      >
                        <ThemedText
                          style={[
                            styles.pickerItemText,
                            selectedYear === year && styles.pickerItemTextSelected,
                            { color: themeColors.text },
                          ]}
                        >
                          {year}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: DesignSystem.colors.primary.main }]}
                onPress={() => {
                  const newDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                  if (newDate > new Date()) {
                    Alert.alert('Fehler', 'Das Geburtsdatum darf nicht in der Zukunft liegen.');
                    return;
                  }
                  setDateOfBirth(newDate);
                  setUserDateOfBirth(
                    newDate.toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  );
                  setShowDatePicker(false);
                }}
              >
                <ThemedText style={styles.confirmButtonText}>Bestätigen</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignSystem.spacing.lg,
  },
  headerButton: {
    padding: DesignSystem.spacing.sm,
    marginLeft: DesignSystem.spacing.sm,
  },
  section: {
    marginBottom: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginBottom: DesignSystem.spacing.sm,
  },
  sectionDescription: {
    fontSize: DesignSystem.typography.fontSize.base,
    lineHeight: DesignSystem.typography.lineHeight.relaxed,
  },
  form: {
    gap: DesignSystem.spacing.lg,
  },
  inputGroup: {
    marginBottom: DesignSystem.spacing.md,
  },
  label: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginBottom: DesignSystem.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[300],
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
    backgroundColor: '#fff',
  },
  inputDark: {
    borderColor: DesignSystem.colors.neutral[600],
    backgroundColor: DesignSystem.colors.neutral[800],
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[300],
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
  },
  selectButtonDark: {
    borderColor: DesignSystem.colors.neutral[600],
  },
  selectButtonText: {
    fontSize: DesignSystem.typography.fontSize.base,
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.xl,
    ...DesignSystem.shadows.md,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: DesignSystem.borderRadius.xl,
    borderTopRightRadius: DesignSystem.borderRadius.xl,
    maxHeight: '80%',
    ...DesignSystem.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[200],
  },
  modalTitle: {
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
  },
  modalCloseButton: {
    padding: DesignSystem.spacing.xs,
  },
  modalBody: {
    maxHeight: 400,
  },
  insuranceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[200],
  },
  insuranceOptionText: {
    fontSize: DesignSystem.typography.fontSize.base,
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
  },
  mapButtonText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[300],
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: DesignSystem.typography.fontSize.base,
    flex: 1,
  },
  placeholderText: {
    opacity: 0.5,
  },
  disabledInput: {
    opacity: 0.5,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: DesignSystem.spacing.md,
    maxHeight: 300,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginBottom: DesignSystem.spacing.sm,
  },
  pickerScrollView: {
    maxHeight: 250,
  },
  pickerItem: {
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    marginVertical: DesignSystem.spacing.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: DesignSystem.colors.primary.main + '20',
  },
  pickerItemText: {
    fontSize: DesignSystem.typography.fontSize.base,
  },
  pickerItemTextSelected: {
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.primary.main,
  },
  confirmButton: {
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    margin: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  userIdContainer: {
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.sm,
  },
  userIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm,
  },
  userIdLabel: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  userIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary.main + '40',
    marginBottom: DesignSystem.spacing.xs,
  },
  userIdText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
    marginRight: DesignSystem.spacing.sm,
  },
  userIdHelp: {
    fontSize: DesignSystem.typography.fontSize.xs,
    lineHeight: DesignSystem.typography.lineHeight.relaxed,
  },
});

