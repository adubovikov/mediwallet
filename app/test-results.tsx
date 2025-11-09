import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TestResult } from '@/types/test-result';
import { DesignSystem, getThemeColors } from '@/constants/design';

type SortOption = 'date' | 'alphabet' | 'group';

export default function TestResultsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = getThemeColors(isDark);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [sortedResults, setSortedResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');

  const loadTestResults = async () => {
    try {
      // Datenbankfunktionen importieren
      const { getAllTestResults } = await import('@/services/database');
      const results = await getAllTestResults();
      setTestResults(results);
      applySorting(results, sortBy);
    } catch (error) {
      console.error('Error loading test results:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applySorting = (results: TestResult[], sortOption: SortOption) => {
    let sorted: TestResult[] = [...results];

    switch (sortOption) {
      case 'date':
        // Nach Datum sortieren (neueste zuerst)
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        break;

      case 'alphabet':
        // Alphabetisch nach Testtyp sortieren
        sorted.sort((a, b) => {
          const typeA = a.testType.toLowerCase();
          const typeB = b.testType.toLowerCase();
          return typeA.localeCompare(typeB);
        });
        break;

      case 'group':
        // Nach Testtyp (Gruppe) sortieren, dann nach Datum innerhalb jeder Gruppe
        sorted.sort((a, b) => {
          const typeA = a.testType.toLowerCase();
          const typeB = b.testType.toLowerCase();
          if (typeA !== typeB) {
            return typeA.localeCompare(typeB);
          }
          // Wenn gleicher Typ, nach Datum sortieren (neueste zuerst)
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        break;
    }

    setSortedResults(sorted);
  };

  const handleSortChange = () => {
    Alert.alert(
      'Sort Tests',
      'Choose sorting option:',
      [
        {
          text: 'By Date (Newest First)',
          onPress: () => {
            setSortBy('date');
            applySorting(testResults, 'date');
          },
        },
        {
          text: 'Alphabetically',
          onPress: () => {
            setSortBy('alphabet');
            applySorting(testResults, 'alphabet');
          },
        },
        {
          text: 'By Group (Type)',
          onPress: () => {
            setSortBy('group');
            applySorting(testResults, 'group');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadTestResults();
    }, [])
  );

  useEffect(() => {
    if (testResults.length > 0) {
      applySorting(testResults, sortBy);
    }
  }, [sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTestResults();
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTestResult = ({ item }: { item: TestResult }) => (
    <TouchableOpacity
      style={[
        styles.card, 
        { 
          backgroundColor: themeColors.surfaceElevated,
          borderColor: themeColors.border,
        },
        isDark && styles.cardDark
      ]}
      onPress={() => {
        router.push(`/test-detail/${item.id}`);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.thumbnailContainer, { backgroundColor: themeColors.surface }]}>
          <Image 
            source={{ uri: item.imagePath }} 
            style={styles.thumbnail} 
            contentFit="cover" 
          />
        </View>
        <View style={styles.cardInfo}>
          <ThemedText 
            style={[styles.testType, { color: themeColors.text }]}
          >
            {item.testType}
          </ThemedText>
          <View style={styles.dateContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={14} 
              color={themeColors.textSecondary} 
            />
            <ThemedText 
              style={[styles.date, { color: themeColors.textSecondary }]}
            >
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
          {item.notes && (
            <ThemedText 
              style={[styles.notes, { color: themeColors.textSecondary }]} 
              numberOfLines={2}
            >
              {item.notes}
            </ThemedText>
          )}
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={themeColors.textSecondary} 
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <Stack.Screen options={{ title: 'Testergebnisse' }} />
        <ActivityIndicator size="large" color={DesignSystem.colors.primary.main} />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Testergebnisse',
          headerBackTitle: 'Zurück',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSortChange} 
              style={[styles.sortButton, { backgroundColor: themeColors.surface }]}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="swap-vertical" 
                size={22} 
                color={themeColors.text} 
              />
            </TouchableOpacity>
          ),
        }}
      />
      {testResults.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: themeColors.surface }]}>
            <Ionicons 
              name="folder-open-outline" 
              size={64} 
              color={themeColors.textSecondary} 
            />
          </View>
          <ThemedText 
            style={[styles.emptyText, { color: themeColors.text }]}
          >
            Noch keine Testergebnisse
          </ThemedText>
          <ThemedText 
            style={[styles.emptySubtext, { color: themeColors.textSecondary }]}
          >
            Scannen Sie Ihr erstes Testergebnis, um zu beginnen
          </ThemedText>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.sortIndicator,
              {
                backgroundColor: themeColors.surface,
                borderBottomColor: themeColors.border,
              },
            ]}
          >
            <Ionicons 
              name="funnel-outline" 
              size={16} 
              color={themeColors.textSecondary} 
            />
            <ThemedText 
              style={[styles.sortText, { color: themeColors.textSecondary }]}
            >
              Sortiert nach: {sortBy === 'date' ? 'Datum' : sortBy === 'alphabet' ? 'Alphabetisch' : 'Gruppe'}
            </ThemedText>
          </View>
          <FlatList
            data={sortedResults}
            renderItem={renderTestResult}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </>
      )}
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
  listContent: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  card: {
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    ...DesignSystem.shadows.md,
  },
  cardDark: {
    shadowOpacity: 0.3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.md,
  },
  thumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: DesignSystem.borderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    gap: DesignSystem.spacing.xs,
  },
  testType: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginBottom: DesignSystem.spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.xs,
  },
  date: {
    fontSize: DesignSystem.typography.fontSize.sm,
  },
  notes: {
    fontSize: DesignSystem.typography.fontSize.sm,
    lineHeight: DesignSystem.typography.fontSize.sm * 1.4,
    marginTop: DesignSystem.spacing.xs,
  },
  chevron: {
    marginLeft: DesignSystem.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  emptyText: {
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginTop: DesignSystem.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: DesignSystem.typography.fontSize.base,
    marginTop: DesignSystem.spacing.sm,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: DesignSystem.typography.fontSize.base * 1.5,
  },
  sortButton: {
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
  },
  sortIndicator: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  sortText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
});

