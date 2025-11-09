import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserSettings, NewUserSettings } from '@/types/user-settings';
import { DesignSystem, getThemeColors } from '@/constants/design';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  const themeColors = getThemeColors(isDark);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [expandedSections, setExpandedSections] = useState<{
    personal: boolean;
    insurance: boolean;
    doctor: boolean;
    openai: boolean;
    aiProvider: boolean;
  }>({
    personal: true,
    insurance: false,
    doctor: false,
    openai: false,
    aiProvider: false,
  });
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [showAiApiKey, setShowAiApiKey] = useState(false);
  const [showAiProviderModal, setShowAiProviderModal] = useState(false);

  // Berechnet die Anzahl der Tage im ausgewählten Monat
  const getDaysInMonth = (month: number, year: number): number => {
    // Monate mit 31 Tagen: Januar (1), März (3), Mai (5), Juli (7), August (8), Oktober (10), Dezember (12)
    // Monate mit 30 Tagen: April (4), Juni (6), September (9), November (11)
    // Februar (2): 28 oder 29 Tage (Schaltjahr)
    if (month === 2) {
      // Schaltjahr: Jahr durch 4 teilbar, aber nicht durch 100, oder durch 400 teilbar
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return isLeapYear ? 29 : 28;
    }
    // Monate mit 31 Tagen
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
      return 31;
    }
    // Monate mit 30 Tagen
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
      // Prüfe Standortberechtigungen
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Berechtigung erforderlich',
          'Standortberechtigung ist erforderlich, um Ihre Position zu verwenden.',
          [{ text: 'OK' }]
        );
      }

      // Zeige Optionen: Aktuelle Position oder Adresse eingeben
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
                
                // Öffne Maps-App mit aktueller Position
                const url = Platform.select({
                  ios: `maps://maps.apple.com/?ll=${latitude},${longitude}`,
                  android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
                });
                
                if (url) {
                  const canOpen = await Linking.canOpenURL(url);
                  if (canOpen) {
                    await Linking.openURL(url);
                  } else {
                    // Fallback zu Google Maps im Browser
                    await Linking.openURL(
                      `https://www.google.com/maps?q=${latitude},${longitude}`
                    );
                  }
                }
              } catch (error) {
                console.error('Fehler beim Abrufen der Position:', error);
                Alert.alert('Fehler', 'Position konnte nicht abgerufen werden.');
              }
            },
          },
          {
            text: 'Adresse suchen',
            onPress: () => {
              // Öffne Maps-App zum Suchen einer Adresse
              const searchQuery = addressType === 'user' 
                ? encodeURIComponent(userAddress || '')
                : encodeURIComponent(doctorAddress || '');
              
              const url = Platform.select({
                ios: `maps://maps.apple.com/?q=${searchQuery}`,
                android: `geo:0,0?q=${searchQuery}`,
              });
              
              if (url) {
                Linking.canOpenURL(url).then((canOpen) => {
                  if (canOpen) {
                    Linking.openURL(url);
                  } else {
                    // Fallback zu Google Maps im Browser
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${searchQuery}`
                    );
                  }
                });
              }
            },
          },
          {
            text: 'Abbrechen',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Fehler beim Öffnen der Karte:', error);
      Alert.alert('Fehler', 'Karte konnte nicht geöffnet werden.');
    }
  };

  // Setzt die Adresse basierend auf der ausgewählten Position
  const handleAddressFromMaps = (address: string, addressType: 'user' | 'doctor') => {
    if (addressType === 'user') {
      setUserAddress(address);
    } else {
      setDoctorAddress(address);
    }
  };

  // Liste der größten deutschen Krankenkassen (alphabetisch sortiert)
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
  ];

  // Liste der bekanntesten KI-Provider
  const AI_PROVIDERS = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: ['GPT-4o', 'GPT-4 Vision', 'GPT-4 Turbo'],
      description: 'GPT-4o mit Vision-Fähigkeiten',
      apiKeyPrefix: 'sk-',
      apiKeyUrl: 'https://platform.openai.com/api-keys',
    },
    {
      id: 'google',
      name: 'Google Gemini',
      models: ['Gemini Pro Vision', 'Gemini 1.5 Pro'],
      description: 'Googles leistungsstarke Vision-Modelle',
      apiKeyPrefix: '',
      apiKeyUrl: 'https://makersuite.google.com/app/apikey',
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      models: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
      description: 'Claude 3 mit Vision-Fähigkeiten',
      apiKeyPrefix: 'sk-ant-',
      apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      models: ['Mistral Large', 'Mistral 7B'],
      description: 'Europäisches KI-Modell',
      apiKeyPrefix: '',
      apiKeyUrl: 'https://console.mistral.ai/api-keys/',
    },
  ];

  // Auswahl der Krankenkasse - öffnet Modal statt Alert
  const openInsuranceModal = () => {
    setShowInsuranceModal(true);
  };
  
  const selectInsuranceCompany = (company: string) => {
    setInsuranceCompany(company);
    setShowInsuranceModal(false);
  };
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorAddress, setDoctorAddress] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (isWeb) {
      setLoading(false);
      return;
    }

    try {
      const { getUserSettings } = await import('@/services/database');
      const settings = await getUserSettings();
      
      if (settings) {
        setUserName(settings.userName);
        setUserPhone(settings.userPhone || '');
        setUserEmail(settings.userEmail || '');
        setUserAddress(settings.userAddress || '');
        setUserDateOfBirth(settings.userDateOfBirth || '');
        // Datum aus String parsen, falls vorhanden
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
        setDoctorName(settings.doctorName);
        setDoctorPhone(settings.doctorPhone || '');
        setDoctorEmail(settings.doctorEmail || '');
        setDoctorAddress(settings.doctorAddress || '');
        setOpenaiApiKey(settings.openaiApiKey || '');
        setAiProvider(settings.aiProvider || 'openai');
        setAiApiKey(settings.aiApiKey || settings.openaiApiKey || '');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
      Alert.alert('Fehler', 'Einstellungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isWeb) {
      Alert.alert(
        'Web-Vorschau',
        'Das Speichern von Einstellungen ist auf Web nicht verfügbar. Bitte verwenden Sie iOS oder Android für die volle Funktionalität.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validierung
    if (!userName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie Ihren Namen ein.');
      return;
    }

    if (!doctorName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie den Namen Ihres Hausarztes ein.');
      return;
    }

    setSaving(true);
    try {
      const { saveUserSettings } = await import('@/services/database');
      // Datum formatieren (ISO-String oder TT.MM.JJJJ Format)
      let formattedDate = '';
      if (dateOfBirth) {
        formattedDate = dateOfBirth.toISOString().split('T')[0]; // YYYY-MM-DD Format
      } else if (userDateOfBirth.trim()) {
        formattedDate = userDateOfBirth.trim();
      }
      
      const settings: NewUserSettings = {
        userName: userName.trim(),
        userPhone: userPhone.trim() || undefined,
        userEmail: userEmail.trim() || undefined,
        userAddress: userAddress.trim() || undefined,
        userDateOfBirth: formattedDate || undefined,
        insuranceCompany: insuranceCompany.trim() || undefined,
        insuranceNumber: insuranceNumber.trim() || undefined,
        doctorName: doctorName.trim(),
        doctorPhone: doctorPhone.trim() || undefined,
        doctorEmail: doctorEmail.trim() || undefined,
        doctorAddress: doctorAddress.trim() || undefined,
        openaiApiKey: openaiApiKey.trim() || undefined,
        aiProvider: aiProvider || 'openai',
        aiApiKey: aiApiKey.trim() || undefined,
      };

      await saveUserSettings(settings);
      Alert.alert('Erfolg', 'Einstellungen wurden gespeichert.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      Alert.alert('Fehler', 'Einstellungen konnten nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Einstellungen' }} />
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Einstellungen',
          headerBackTitle: 'Zurück',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave} 
              style={styles.saveButton} 
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isWeb && (
          <View style={[styles.webWarning, isDark && styles.webWarningDark]}>
            <Ionicons name="warning" size={24} color="#ffc107" />
            <ThemedText style={styles.webWarningText}>
              Einstellungen können auf Web nicht gespeichert werden. Bitte verwenden Sie iOS oder Android.
            </ThemedText>
          </View>
        )}

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <TouchableOpacity
            style={[styles.accordionHeader, isDark && styles.accordionHeaderDark]}
            onPress={() =>
              setExpandedSections((prev) => ({ ...prev, personal: !prev.personal }))
            }
            activeOpacity={0.7}
          >
            <View style={styles.accordionHeaderContent}>
              <Ionicons
                name="person-outline"
                size={24}
                color={isDark ? '#fff' : '#4A90E2'}
              />
              <ThemedText style={styles.sectionTitle}>Persönliche Informationen</ThemedText>
            </View>
            <Ionicons
              name={expandedSections.personal ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={isDark ? '#ccc' : '#666'}
            />
          </TouchableOpacity>

          {expandedSections.personal && (
            <View style={styles.accordionContent}>
              <TouchableOpacity
                style={[
                  styles.quickActionButton,
                  { backgroundColor: DesignSystem.colors.primary.main },
                ]}
                onPress={() => router.push('/personal-info')}
                activeOpacity={0.8}
              >
                <Ionicons name="person-outline" size={20} color="#fff" />
                <ThemedText style={styles.quickActionButtonText}>
                  Persönliche Informationen bearbeiten
                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

          {/* KI-Provider Auswahl */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
            <TouchableOpacity
              style={[styles.accordionHeader, isDark && styles.accordionHeaderDark]}
              onPress={() =>
                setExpandedSections((prev) => ({ ...prev, aiProvider: !prev.aiProvider }))
              }
              activeOpacity={0.7}
            >
              <View style={styles.accordionHeaderContent}>
                <Ionicons
                  name="sparkles-outline"
                  size={24}
                  color={isDark ? '#fff' : '#8B5CF6'}
                />
                <ThemedText style={styles.sectionTitle}>KI-Provider</ThemedText>
              </View>
              <Ionicons
                name={expandedSections.aiProvider ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={isDark ? '#ccc' : '#666'}
              />
            </TouchableOpacity>

            {expandedSections.aiProvider && (
              <View style={styles.accordionContent}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>KI-Provider auswählen *</ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      isDark && styles.selectButtonDark,
                      { backgroundColor: themeColors.surface },
                    ]}
                    onPress={() => setShowAiProviderModal(true)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.selectButtonText,
                        { color: aiProvider ? themeColors.text : themeColors.textSecondary },
                      ]}
                    >
                      {AI_PROVIDERS.find(p => p.id === aiProvider)?.name || 'KI-Provider auswählen'}
                    </ThemedText>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>
                  {aiProvider && (
                    <ThemedText style={[styles.helpText, { color: themeColors.textSecondary }]}>
                      {AI_PROVIDERS.find(p => p.id === aiProvider)?.description || ''}
                    </ThemedText>
                  )}
                </View>

                {aiProvider && (
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <ThemedText style={styles.label}>
                        {AI_PROVIDERS.find(p => p.id === aiProvider)?.name} API-Key
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => setShowAiApiKey(!showAiApiKey)}
                        style={styles.eyeButton}
                      >
                        <Ionicons
                          name={showAiApiKey ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={isDark ? '#ccc' : '#666'}
                        />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        isDark && styles.inputDark,
                        { color: isDark ? '#fff' : '#000' },
                      ]}
                      value={aiApiKey}
                      onChangeText={setAiApiKey}
                      placeholder={AI_PROVIDERS.find(p => p.id === aiProvider)?.apiKeyPrefix ? `${AI_PROVIDERS.find(p => p.id === aiProvider)?.apiKeyPrefix}...` : 'API-Key eingeben'}
                      placeholderTextColor={isDark ? '#888' : '#999'}
                      secureTextEntry={!showAiApiKey}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isWeb}
                    />
                    <ThemedText style={[styles.helpText, { color: themeColors.textSecondary }]}>
                      Der API-Key wird sicher in der Datenbank gespeichert. Sie können einen Key auf{' '}
                      <ThemedText
                        style={[styles.linkText, { color: DesignSystem.colors.primary.main }]}
                        onPress={() => {
                          if (Platform.OS !== 'web' && AI_PROVIDERS.find(p => p.id === aiProvider)?.apiKeyUrl) {
                            Linking.openURL(AI_PROVIDERS.find(p => p.id === aiProvider)!.apiKeyUrl);
                          }
                        }}
                      >
                        {AI_PROVIDERS.find(p => p.id === aiProvider)?.apiKeyUrl?.replace('https://', '') || 'Provider-Website'}
                      </ThemedText>{' '}
                      erhalten.
                    </ThemedText>
                    {aiApiKey && (
                      <View style={[styles.statusBox, { backgroundColor: themeColors.surface }]}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={DesignSystem.colors.success}
                        />
                        <ThemedText
                          style={[styles.statusText, { color: DesignSystem.colors.success }]}
                        >
                          API-Key konfiguriert
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* KI-Analyse (OpenAI) Accordion - Legacy */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
            <TouchableOpacity
              style={[styles.accordionHeader, isDark && styles.accordionHeaderDark]}
              onPress={() =>
                setExpandedSections((prev) => ({ ...prev, openai: !prev.openai }))
              }
              activeOpacity={0.7}
            >
              <View style={styles.accordionHeaderContent}>
                <Ionicons
                  name="sparkles-outline"
                  size={24}
                  color={isDark ? '#fff' : '#8B5CF6'}
                />
                <ThemedText style={styles.sectionTitle}>KI-Analyse (OpenAI) - Legacy</ThemedText>
              </View>
              <Ionicons
                name={expandedSections.openai ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={isDark ? '#ccc' : '#666'}
              />
            </TouchableOpacity>

            {expandedSections.openai && (
              <View style={styles.accordionContent}>
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.helpText, { color: themeColors.textSecondary }]}>
                    Diese Einstellung ist veraltet. Bitte verwenden Sie die "KI-Provider" Auswahl oben.
                  </ThemedText>
                  <View style={styles.labelRow}>
                    <ThemedText style={styles.label}>OpenAI API-Key</ThemedText>
                    <TouchableOpacity
                      onPress={() => setShowApiKey(!showApiKey)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showApiKey ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={isDark ? '#ccc' : '#666'}
                      />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      isDark && styles.inputDark,
                      { color: isDark ? '#fff' : '#000' },
                    ]}
                    value={openaiApiKey}
                    onChangeText={setOpenaiApiKey}
                    placeholder="sk-..."
                    placeholderTextColor={isDark ? '#888' : '#999'}
                    secureTextEntry={!showApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isWeb}
                  />
                  <ThemedText style={[styles.helpText, { color: themeColors.textSecondary }]}>
                    Der API-Key wird sicher in der Datenbank gespeichert. Sie können einen Key auf{' '}
                    <ThemedText
                      style={[styles.linkText, { color: DesignSystem.colors.primary.main }]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Linking.openURL('https://platform.openai.com/api-keys');
                        }
                      }}
                    >
                      platform.openai.com/api-keys
                    </ThemedText>{' '}
                    erhalten.
                  </ThemedText>
                  {openaiApiKey && (
                    <View style={[styles.statusBox, { backgroundColor: themeColors.surface }]}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={DesignSystem.colors.success}
                      />
                      <ThemedText
                        style={[styles.statusText, { color: DesignSystem.colors.success }]}
                      >
                        API-Key konfiguriert
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* KI-Provider Auswahl Modal */}
        <Modal
          visible={showAiProviderModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAiProviderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.surfaceElevated }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={[styles.modalTitle, { color: themeColors.text }]}>
                  KI-Provider auswählen
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setShowAiProviderModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {AI_PROVIDERS.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    style={[
                      styles.insuranceOption,
                      aiProvider === provider.id && {
                        backgroundColor: DesignSystem.colors.primary.main + '20',
                      },
                    ]}
                    onPress={() => {
                      setAiProvider(provider.id);
                      setShowAiProviderModal(false);
                      // Wenn bereits ein API-Key vorhanden ist, behalten wir ihn
                      if (!aiApiKey && openaiApiKey && provider.id === 'openai') {
                        setAiApiKey(openaiApiKey);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={[
                          styles.insuranceOptionText,
                          {
                            color:
                              aiProvider === provider.id
                                ? DesignSystem.colors.primary.main
                                : themeColors.text,
                            fontWeight:
                              aiProvider === provider.id
                                ? DesignSystem.typography.fontWeight.semibold
                                : DesignSystem.typography.fontWeight.normal,
                          },
                        ]}
                      >
                        {provider.name}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.helpText,
                          {
                            color: themeColors.textSecondary,
                            fontSize: DesignSystem.typography.fontSize.sm,
                            marginTop: DesignSystem.spacing.xs,
                          },
                        ]}
                      >
                        {provider.description}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.helpText,
                          {
                            color: themeColors.textSecondary,
                            fontSize: DesignSystem.typography.fontSize.xs,
                            marginTop: DesignSystem.spacing.xs,
                          },
                        ]}
                      >
                        Modelle: {provider.models.join(', ')}
                      </ThemedText>
                    </View>
                    {aiProvider === provider.id && (
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

        {/* Speichern-Button */}
        <View style={[styles.footer, { backgroundColor: themeColors.surface }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: DesignSystem.colors.primary.main },
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || isWeb}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="save-outline" size={24} color="#fff" />
            )}
            <ThemedText style={styles.saveButtonText}>
              {saving ? 'Speichere...' : 'Einstellungen speichern'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  webWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  webWarningDark: {
    backgroundColor: '#856404',
    borderColor: '#ffc107',
  },
  webWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: 0,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionDark: {
    backgroundColor: DesignSystem.colors.dark.surface,
    borderColor: DesignSystem.colors.dark.border,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  accordionHeaderDark: {
    borderBottomColor: DesignSystem.colors.dark.border,
  },
  accordionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    flex: 1,
  },
  accordionContent: {
    padding: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.sm,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  quickActionButtonText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    flex: 1,
  },
  inputGroup: {
    marginBottom: DesignSystem.spacing.md,
  },
  label: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    marginBottom: DesignSystem.spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  mapButtonText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  mapButtonTextDisabled: {
    color: '#999',
    opacity: 0.5,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectButtonText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectInputText: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    backgroundColor: DesignSystem.colors.light.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
    borderWidth: 1,
    borderColor: DesignSystem.colors.light.border,
    minHeight: 48,
  },
  inputDark: {
    backgroundColor: DesignSystem.colors.dark.surface,
    borderColor: DesignSystem.colors.dark.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    opacity: 0.6,
  },
  disabledInput: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#2c2c2c',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  pickerScrollView: {
    flex: 1,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#4A90E2',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#666',
  },
  pickerItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: DesignSystem.colors.primary.main,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    alignItems: 'center',
    marginTop: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.md,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  saveButton: {
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    backgroundColor: DesignSystem.colors.primary.main,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requiredNote: {
    fontSize: DesignSystem.typography.fontSize.xs,
    opacity: 0.6,
    marginTop: DesignSystem.spacing.sm,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: DesignSystem.borderRadius.xl,
    borderTopRightRadius: DesignSystem.borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: DesignSystem.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.light.border,
  },
  modalTitle: {
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  modalCloseButton: {
    padding: DesignSystem.spacing.xs,
  },
  modalBody: {
    padding: DesignSystem.spacing.md,
    maxHeight: 400,
  },
  insuranceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    marginBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.md,
  },
  insuranceOptionText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    flex: 1,
  },
  modalFooter: {
    padding: DesignSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.light.border,
  },
  modalButton: {
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    ...DesignSystem.shadows.sm,
  },
  modalButtonCancelText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  eyeButton: {
    padding: DesignSystem.spacing.xs,
  },
  helpText: {
    fontSize: DesignSystem.typography.fontSize.xs,
    marginTop: DesignSystem.spacing.xs,
    lineHeight: DesignSystem.typography.fontSize.xs * 1.4,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    marginTop: DesignSystem.spacing.sm,
  },
  statusText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
});

