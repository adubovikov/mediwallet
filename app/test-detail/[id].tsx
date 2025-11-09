import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TestResult } from '@/types/test-result';
import { DesignSystem, getThemeColors } from '@/constants/design';

export default function TestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = getThemeColors(isDark);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedType, setEditedType] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedHours, setSelectedHours] = useState(24);
  const [customDoctorName, setCustomDoctorName] = useState('');
  const [customDoctorEmail, setCustomDoctorEmail] = useState('');
  const [userSettings, setUserSettings] = useState<any>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAnalysisResultsModal, setShowAnalysisResultsModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [isAnalysisSaved, setIsAnalysisSaved] = useState(false);

  useEffect(() => {
    loadTestResult();
    loadUserSettings();
  }, [id]);
  
  const loadUserSettings = async () => {
    try {
      const { getUserSettings } = await import('@/services/database');
      const settings = await getUserSettings();
      setUserSettings(settings);
      if (settings?.doctorName) {
        setSelectedDoctor(settings.doctorName);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadTestResult = async () => {
    try {
      // Datenbankfunktionen importieren
      const { getTestResultById } = await import('@/services/database');
      const result = await getTestResultById(Number(id));
      setTestResult(result);
      if (result) {
        setEditedNotes(result.notes || '');
        setEditedType(result.testType || '');
        // Lade gespeicherte Analyse, falls vorhanden
        if (result.analyzedData) {
          setAiAnalysis(result.analyzedData);
          setIsAnalysisSaved(true);
        } else {
          setAiAnalysis('');
          setIsAnalysisSaved(false);
        }
      }
    } catch (error) {
      console.error('Error loading test result:', error);
      Alert.alert('Error', 'Failed to load test result');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!testResult) return;

    try {
      // Datenbankfunktionen importieren
      const { updateTestResult } = await import('@/services/database');
      await updateTestResult(testResult.id, {
        testType: editedType,
        notes: editedNotes,
      });
      
      Alert.alert('Success', 'Test result updated successfully');
      setIsEditing(false);
      loadTestResult();
    } catch (error) {
      console.error('Error updating test result:', error);
      Alert.alert('Error', 'Failed to update test result');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Test Result',
      'Are you sure you want to delete this test result? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Datenbankfunktionen importieren
              const { deleteTestResult } = await import('@/services/database');
              await deleteTestResult(Number(id));
              Alert.alert('Success', 'Test result deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting test result:', error);
              Alert.alert('Error', 'Failed to delete test result');
            }
          },
        },
      ]
    );
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <Stack.Screen options={{ title: 'Testergebnis' }} />
        <ActivityIndicator size="large" color={DesignSystem.colors.primary.main} />
      </View>
    );
  }

  if (!testResult) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Test Result' }} />
        <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
        <ThemedText style={styles.emptyText}>Test result not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Testergebnis Details',
          headerRight: () => (
            <View style={styles.headerButtons}>
              {isEditing ? (
                <>
                  <TouchableOpacity 
                    onPress={handleSave} 
                    style={[styles.headerButton, { backgroundColor: DesignSystem.colors.primary.main }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditing(false);
                      setEditedNotes(testResult.notes || '');
                      setEditedType(testResult.testType || '');
                    }}
                    style={[styles.headerButton, { backgroundColor: DesignSystem.colors.error }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={() => setIsEditing(true)} 
                    style={[styles.headerButton, { backgroundColor: DesignSystem.colors.primary.main }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleDelete} 
                    style={[styles.headerButton, { backgroundColor: DesignSystem.colors.error }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: testResult.imagePath }} style={styles.image} contentFit="contain" />

        <View style={[
          styles.infoCard, 
          { 
            backgroundColor: themeColors.surfaceElevated,
            borderColor: themeColors.border,
          },
          isDark && styles.infoCardDark
        ]}>
          <View style={styles.infoRow}>
            <View style={[styles.iconContainer, { backgroundColor: DesignSystem.colors.primary.light + '20' }]}>
              <Ionicons name="calendar" size={18} color={DesignSystem.colors.primary.main} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Datum
              </ThemedText>
              <ThemedText style={[styles.infoValue, { color: themeColors.text }]}>
                {formatDate(testResult.createdAt)}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: themeColors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconContainer, { backgroundColor: DesignSystem.colors.secondary.light + '20' }]}>
              <Ionicons name="flask" size={18} color={DesignSystem.colors.secondary.main} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Testtyp
              </ThemedText>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                    isDark && styles.inputDark,
                  ]}
                  value={editedType}
                  onChangeText={setEditedType}
                  placeholder="Testtyp eingeben"
                  placeholderTextColor={themeColors.textSecondary}
                />
              ) : (
                <ThemedText style={[styles.infoValue, { color: themeColors.text }]}>
                  {testResult.testType}
                </ThemedText>
              )}
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: themeColors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconContainer, { backgroundColor: DesignSystem.colors.accent.light + '20' }]}>
              <Ionicons name="document-text" size={18} color={DesignSystem.colors.accent.main} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Notizen
              </ThemedText>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { 
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                    isDark && styles.inputDark,
                  ]}
                  value={editedNotes}
                  onChangeText={setEditedNotes}
                  placeholder="Notizen hinzufügen..."
                  placeholderTextColor={themeColors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              ) : (
                <ThemedText style={[styles.infoValue, { color: themeColors.text }]}>
                  {testResult.notes || 'Keine Notizen hinzugefügt'}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.aiButton, 
            { backgroundColor: DesignSystem.colors.accent.main },
            isDark && styles.aiButtonDark,
            analyzing && styles.aiButtonDisabled
          ]}
          onPress={async () => {
            if (analyzing || !testResult) return;
            
            setAnalyzing(true);
            setShowAIModal(true);
            setAiAnalysis('');
            
            try {
              console.log('Starting AI analysis...');
              console.log('Test result:', {
                id: testResult.id,
                imagePath: testResult.imagePath,
                testType: testResult.testType,
              });
              
              const { analyzeTestResultImage } = await import('@/services/ai-analysis');
              console.log('AI analysis function imported');
              
              const analysis = await analyzeTestResultImage(
                testResult.imagePath,
                testResult.testType
              );
              
              console.log('Analysis received, length:', analysis.length);
              setAiAnalysis(analysis);
              
              // Prüfe, ob bereits eine gespeicherte Analyse existiert
              if (testResult.analyzedData) {
                setIsAnalysisSaved(true);
              } else {
                setIsAnalysisSaved(false);
              }
            } catch (error: any) {
              console.error('Error analyzing test result:', error);
              console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
              });
              
              // Detaillierte Fehlermeldung anzeigen
              const errorMessage = error.message || 'Unbekannter Fehler';
              setAiAnalysis(
                `❌ Fehler bei der KI-Analyse\n\n${errorMessage}\n\n` +
                'Mögliche Lösungen:\n' +
                '• Überprüfen Sie Ihre Internetverbindung\n' +
                '• Stellen Sie sicher, dass ein OpenAI API-Key konfiguriert ist\n' +
                '• Überprüfen Sie, ob das Bild gültig ist\n' +
                '• Versuchen Sie es später erneut'
              );
            } finally {
              setAnalyzing(false);
            }
          }}
          activeOpacity={0.8}
          disabled={analyzing}
        >
          {analyzing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="sparkles" size={24} color="#fff" />
          )}
          <ThemedText style={styles.aiButtonText}>
            {analyzing ? 'Analysiere...' : 'KI-Analyse anfordern'}
          </ThemedText>
        </TouchableOpacity>

        {testResult?.analyzedData && (
          <TouchableOpacity
            style={[
              styles.analysisResultsButton, 
              { backgroundColor: DesignSystem.colors.primary.main },
              isDark && styles.analysisResultsButtonDark
            ]}
            onPress={() => {
              setAiAnalysis(testResult.analyzedData || '');
              setIsAnalysisSaved(true);
              setShowAnalysisResultsModal(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={24} color="#fff" />
            <ThemedText style={styles.analysisResultsButtonText}>Analyse-Ergebnisse</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.shareButton, 
            { backgroundColor: DesignSystem.colors.secondary.main },
            isDark && styles.shareButtonDark
          ]}
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={24} color="#fff" />
          <ThemedText style={styles.shareButtonText}>Freigeben</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Freigabe-Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: themeColors.text }]}>
                Testergebnis freigeben
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <ThemedText style={[styles.modalLabel, { color: themeColors.text }]}>
                  Arzt auswählen
                </ThemedText>
                {userSettings?.doctorName && (
                  <TouchableOpacity
                    style={[
                      styles.doctorOption,
                      { 
                        backgroundColor: selectedDoctor === userSettings.doctorName 
                          ? DesignSystem.colors.primary.main 
                          : themeColors.surface,
                        borderColor: themeColors.border,
                      }
                    ]}
                    onPress={() => {
                      setSelectedDoctor(userSettings.doctorName);
                      setCustomDoctorName('');
                    }}
                  >
                    <Ionicons 
                      name={selectedDoctor === userSettings.doctorName ? "checkmark-circle" : "radio-button-off"} 
                      size={24} 
                      color={selectedDoctor === userSettings.doctorName ? '#fff' : themeColors.textSecondary} 
                    />
                    <View style={styles.doctorOptionContent}>
                      <ThemedText 
                        style={[
                          styles.doctorOptionText,
                          { color: selectedDoctor === userSettings.doctorName ? '#fff' : themeColors.text }
                        ]}
                      >
                        {userSettings.doctorName}
                      </ThemedText>
                      {userSettings.doctorEmail && (
                        <ThemedText 
                          style={[
                            styles.doctorOptionEmail,
                            { color: selectedDoctor === userSettings.doctorName ? '#fff' : themeColors.textSecondary }
                          ]}
                        >
                          {userSettings.doctorEmail}
                        </ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.doctorOption,
                    { 
                      backgroundColor: selectedDoctor === 'custom' 
                        ? DesignSystem.colors.primary.main 
                        : themeColors.surface,
                      borderColor: themeColors.border,
                    }
                  ]}
                  onPress={() => {
                    setSelectedDoctor('custom');
                    setCustomDoctorName('');
                  }}
                >
                  <Ionicons 
                    name={selectedDoctor === 'custom' ? "checkmark-circle" : "radio-button-off"} 
                    size={24} 
                    color={selectedDoctor === 'custom' ? '#fff' : themeColors.textSecondary} 
                  />
                  <ThemedText 
                    style={[
                      styles.doctorOptionText,
                      { color: selectedDoctor === 'custom' ? '#fff' : themeColors.text }
                    ]}
                  >
                    Anderer Arzt
                  </ThemedText>
                </TouchableOpacity>

                {selectedDoctor === 'custom' && (
                  <View style={styles.customDoctorInputs}>
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          color: themeColors.text,
                        }
                      ]}
                      value={customDoctorName}
                      onChangeText={setCustomDoctorName}
                      placeholder="Name des Arztes"
                      placeholderTextColor={themeColors.textSecondary}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          color: themeColors.text,
                        },
                        styles.inputMarginTop
                      ]}
                      value={customDoctorEmail}
                      onChangeText={setCustomDoctorEmail}
                      placeholder="E-Mail-Adresse (optional)"
                      placeholderTextColor={themeColors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}
              </View>

              <View style={styles.modalSection}>
                <ThemedText style={[styles.modalLabel, { color: themeColors.text }]}>
                  Gültigkeitsdauer (max. 48 Stunden)
                </ThemedText>
                <View style={styles.hoursContainer}>
                  {[1, 2, 4, 8, 12, 24, 48].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[
                        styles.hourOption,
                        {
                          backgroundColor: selectedHours === hours
                            ? DesignSystem.colors.primary.main
                            : themeColors.surface,
                          borderColor: themeColors.border,
                        }
                      ]}
                      onPress={() => setSelectedHours(hours)}
                    >
                      <ThemedText
                        style={[
                          styles.hourOptionText,
                          { color: selectedHours === hours ? '#fff' : themeColors.text }
                        ]}
                      >
                        {hours}h
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowShareModal(false)}
              >
                <ThemedText style={styles.modalButtonCancelText}>Abbrechen</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  { backgroundColor: DesignSystem.colors.primary.main }
                ]}
                onPress={async () => {
                  const doctorName = selectedDoctor === 'custom' 
                    ? customDoctorName 
                    : selectedDoctor;
                  
                  if (!doctorName) {
                    Alert.alert('Fehler', 'Bitte wählen Sie einen Arzt aus oder geben Sie einen Namen ein.');
                    return;
                  }

                  if (selectedDoctor === 'custom' && !customDoctorName.trim()) {
                    Alert.alert('Fehler', 'Bitte geben Sie den Namen des Arztes ein.');
                    return;
                  }

                  try {
                    const expiresAt = new Date();
                    expiresAt.setHours(expiresAt.getHours() + selectedHours);
                    
                    const { createTestResultShare } = await import('@/services/database');
                    await createTestResultShare(
                      testResult!.id,
                      doctorName,
                      selectedDoctor === 'custom' ? customDoctorEmail || null : userSettings?.doctorEmail || null,
                      expiresAt.toISOString()
                    );
                    
                    Alert.alert(
                      'Erfolg',
                      `Testergebnis wurde für ${doctorName} freigegeben. Die Freigabe läuft in ${selectedHours} Stunden ab.`,
                      [{ text: 'OK', onPress: () => setShowShareModal(false) }]
                    );
                  } catch (error) {
                    console.error('Error creating share:', error);
                    Alert.alert('Fehler', 'Die Freigabe konnte nicht erstellt werden.');
                  }
                }}
              >
                <ThemedText style={styles.modalButtonConfirmText}>Freigeben</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* KI-Analyse-Modal */}
      <Modal
        visible={showAIModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Ionicons name="sparkles" size={24} color={DesignSystem.colors.accent.main} />
                <ThemedText style={[styles.modalTitle, { color: themeColors.text }]}>
                  KI-Analyse
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setShowAIModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {analyzing ? (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="large" color={DesignSystem.colors.accent.main} />
                  <ThemedText style={[styles.analyzingText, { color: themeColors.text }]}>
                    Analysiere Testergebnis...
                  </ThemedText>
                  <ThemedText style={[styles.analyzingSubtext, { color: themeColors.textSecondary }]}>
                    Dies kann einige Sekunden dauern
                  </ThemedText>
                </View>
              ) : aiAnalysis ? (
                <View style={styles.analysisContainer}>
                  <ThemedText style={[styles.analysisText, { color: themeColors.text }]}>
                    {aiAnalysis}
                  </ThemedText>
                  <View style={[styles.disclaimerBox, { backgroundColor: themeColors.surface }]}>
                    <Ionicons 
                      name="information-circle-outline" 
                      size={20} 
                      color={DesignSystem.colors.warning} 
                    />
                    <ThemedText style={[styles.disclaimerText, { color: themeColors.textSecondary }]}>
                      Hinweis: Diese Analyse ist keine medizinische Diagnose. Bitte konsultieren Sie immer einen Arzt für eine professionelle Bewertung.
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyAnalysisContainer}>
                  <Ionicons name="document-text-outline" size={64} color={themeColors.textSecondary} />
                  <ThemedText style={[styles.emptyAnalysisText, { color: themeColors.text }]}>
                    Keine Analyse verfügbar
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {aiAnalysis && !analyzing && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalButtonDelete,
                      { backgroundColor: isAnalysisSaved ? DesignSystem.colors.error : DesignSystem.colors.neutral[300] }
                    ]}
                    onPress={async () => {
                      if (!isAnalysisSaved) {
                        // Analyse löschen (nur aus dem State)
                        setAiAnalysis('');
                        setIsAnalysisSaved(false);
                        setShowAIModal(false);
                      } else {
                        // Gespeicherte Analyse aus Datenbank löschen
                        Alert.alert(
                          'Analyse löschen',
                          'Möchten Sie die gespeicherte Analyse wirklich löschen?',
                          [
                            {
                              text: 'Abbrechen',
                              style: 'cancel',
                            },
                            {
                              text: 'Löschen',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  const { updateTestResult } = await import('@/services/database');
                                  await updateTestResult(testResult!.id, {
                                    analyzedData: undefined,
                                  });
                                  setAiAnalysis('');
                                  setIsAnalysisSaved(false);
                                  setShowAIModal(false);
                                  Alert.alert('Erfolg', 'Analyse wurde gelöscht.');
                                } catch (error) {
                                  console.error('Error deleting analysis:', error);
                                  Alert.alert('Fehler', 'Analyse konnte nicht gelöscht werden.');
                                }
                              },
                            },
                          ]
                        );
                      }
                    }}
                  >
                    <Ionicons 
                      name={isAnalysisSaved ? "trash-outline" : "close-outline"} 
                      size={20} 
                      color={isAnalysisSaved ? "#fff" : DesignSystem.colors.neutral[700]} 
                    />
                    <ThemedText 
                      style={[
                        styles.modalButtonText,
                        { color: isAnalysisSaved ? "#fff" : DesignSystem.colors.neutral[700] }
                      ]}
                    >
                      {isAnalysisSaved ? 'Löschen' : 'Verwerfen'}
                    </ThemedText>
                  </TouchableOpacity>
                  
                  {!isAnalysisSaved && (
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.modalButtonConfirm,
                        { backgroundColor: DesignSystem.colors.success }
                      ]}
                      onPress={async () => {
                        try {
                          const { updateTestResult } = await import('@/services/database');
                          await updateTestResult(testResult!.id, {
                            analyzedData: aiAnalysis,
                          });
                          setIsAnalysisSaved(true);
                          Alert.alert('Erfolg', 'Analyse wurde gespeichert.');
                        } catch (error) {
                          console.error('Error saving analysis:', error);
                          Alert.alert('Fehler', 'Analyse konnte nicht gespeichert werden.');
                        }
                      }}
                    >
                      <Ionicons name="save-outline" size={20} color="#fff" />
                      <ThemedText style={styles.modalButtonConfirmText}>Speichern</ThemedText>
                    </TouchableOpacity>
                  )}
                </>
              )}
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  { 
                    backgroundColor: DesignSystem.colors.accent.main,
                    flex: aiAnalysis && !analyzing ? 0 : 1,
                  }
                ]}
                onPress={() => setShowAIModal(false)}
              >
                <ThemedText style={styles.modalButtonConfirmText}>
                  {aiAnalysis && !analyzing ? 'Schließen' : 'Abbrechen'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Analyse-Ergebnisse-Modal */}
      <Modal
        visible={showAnalysisResultsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAnalysisResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Ionicons name="document-text-outline" size={24} color={DesignSystem.colors.primary.main} />
                <ThemedText style={[styles.modalTitle, { color: themeColors.text }]}>
                  Analyse-Ergebnisse
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setShowAnalysisResultsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {testResult?.analyzedData ? (
                <View style={styles.analysisContainer}>
                  <ThemedText style={[styles.analysisText, { color: themeColors.text }]}>
                    {testResult.analyzedData}
                  </ThemedText>
                  <View style={[styles.disclaimerBox, { backgroundColor: themeColors.surface }]}>
                    <Ionicons 
                      name="information-circle-outline" 
                      size={20} 
                      color={DesignSystem.colors.warning} 
                    />
                    <ThemedText style={[styles.disclaimerText, { color: themeColors.textSecondary }]}>
                      Hinweis: Diese Analyse ist keine medizinische Diagnose. Bitte konsultieren Sie immer einen Arzt für eine professionelle Bewertung.
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyAnalysisContainer}>
                  <Ionicons name="document-text-outline" size={64} color={themeColors.textSecondary} />
                  <ThemedText style={[styles.emptyAnalysisText, { color: themeColors.text }]}>
                    Keine Analyse verfügbar
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {testResult?.analyzedData && (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalButtonDelete,
                    { backgroundColor: DesignSystem.colors.error }
                  ]}
                  onPress={async () => {
                    Alert.alert(
                      'Analyse löschen',
                      'Möchten Sie die gespeicherte Analyse wirklich löschen?',
                      [
                        {
                          text: 'Abbrechen',
                          style: 'cancel',
                        },
                        {
                          text: 'Löschen',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              const { updateTestResult } = await import('@/services/database');
                              await updateTestResult(testResult!.id, {
                                analyzedData: undefined,
                              });
                              setAiAnalysis('');
                              setIsAnalysisSaved(false);
                              setShowAnalysisResultsModal(false);
                              // Testergebnis neu laden, um den Button zu aktualisieren
                              loadTestResult();
                              Alert.alert('Erfolg', 'Analyse wurde gelöscht.');
                            } catch (error) {
                              console.error('Error deleting analysis:', error);
                              Alert.alert('Fehler', 'Analyse konnte nicht gelöscht werden.');
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <ThemedText style={[styles.modalButtonText, { color: "#fff" }]}>
                    Löschen
                  </ThemedText>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  { 
                    backgroundColor: DesignSystem.colors.accent.main,
                    flex: testResult?.analyzedData ? 0 : 1,
                  }
                ]}
                onPress={() => setShowAnalysisResultsModal(false)}
              >
                <ThemedText style={styles.modalButtonConfirmText}>Schließen</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  image: {
    width: '100%',
    height: 300,
    borderRadius: DesignSystem.borderRadius.lg,
    backgroundColor: DesignSystem.colors.neutral[100],
    marginBottom: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.light.border,
  },
  infoCard: {
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    ...DesignSystem.shadows.md,
  },
  infoCardDark: {
    shadowOpacity: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: DesignSystem.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: DesignSystem.spacing.xs,
  },
  infoLabel: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: DesignSystem.typography.fontSize.base,
    lineHeight: DesignSystem.typography.fontSize.base * 1.5,
  },
  separator: {
    height: 1,
    marginVertical: DesignSystem.spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
  },
  headerButton: {
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
  },
  input: {
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
    marginTop: DesignSystem.spacing.xs,
    borderWidth: 1,
    minHeight: 44,
  },
  inputDark: {
    // Styles werden dynamisch angewendet
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  aiButton: {
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
    ...DesignSystem.shadows.lg,
  },
  aiButtonDark: {
    shadowOpacity: 0.4,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  shareButton: {
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
    ...DesignSystem.shadows.lg,
  },
  shareButtonDark: {
    shadowOpacity: 0.4,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  analysisResultsButton: {
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
    ...DesignSystem.shadows.md,
  },
  analysisResultsButtonDark: {
    shadowOpacity: 0.4,
  },
  analysisResultsButtonText: {
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
  },
  modalSection: {
    marginBottom: DesignSystem.spacing.lg,
  },
  modalLabel: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginBottom: DesignSystem.spacing.md,
  },
  doctorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    marginBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm,
  },
  doctorOptionContent: {
    flex: 1,
  },
  doctorOptionText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  doctorOptionEmail: {
    fontSize: DesignSystem.typography.fontSize.sm,
    marginTop: DesignSystem.spacing.xs,
  },
  customDoctorInputs: {
    marginTop: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  inputMarginTop: {
    marginTop: DesignSystem.spacing.sm,
  },
  hoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.sm,
  },
  hourOption: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  hourOptionText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.light.border,
  },
  modalButton: {
    flex: 1,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: DesignSystem.colors.neutral[200],
  },
  modalButtonCancelText: {
    color: DesignSystem.colors.neutral[700],
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  modalButtonConfirm: {
    ...DesignSystem.shadows.md,
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  modalButtonDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.spacing.xs,
  },
  modalButtonText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  analyzingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xxl,
    gap: DesignSystem.spacing.md,
  },
  analyzingText: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  analyzingSubtext: {
    fontSize: DesignSystem.typography.fontSize.sm,
    textAlign: 'center',
  },
  analysisContainer: {
    gap: DesignSystem.spacing.md,
  },
  analysisText: {
    fontSize: DesignSystem.typography.fontSize.base,
    lineHeight: DesignSystem.typography.fontSize.base * 1.6,
    whiteSpace: 'pre-line',
  },
  disclaimerBox: {
    flexDirection: 'row',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.warning + '40',
  },
  disclaimerText: {
    flex: 1,
    fontSize: DesignSystem.typography.fontSize.sm,
    lineHeight: DesignSystem.typography.fontSize.sm * 1.4,
  },
  emptyAnalysisContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xxl,
  },
  emptyAnalysisText: {
    fontSize: DesignSystem.typography.fontSize.base,
    marginTop: DesignSystem.spacing.md,
    textAlign: 'center',
  },
});

