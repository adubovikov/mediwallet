import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DesignSystem, getThemeColors } from '@/constants/design';
import { getChatConversations, getUserSettings } from '@/services/database';
import { ChatConversation } from '@/types/chat-message';

export default function ChatListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = getThemeColors(isDark);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [newChatUserId, setNewChatUserId] = useState('');
  const [showNewChatInput, setShowNewChatInput] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
      // Aktualisiere alle 5 Sekunden
      const interval = setInterval(loadConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    try {
      const settings = await getUserSettings();
      if (settings && settings.userId) {
        setCurrentUserId(settings.userId);
      } else if (settings && settings.userName) {
        // Fallback für alte Nutzer ohne userId
        setCurrentUserId(settings.userName);
      } else {
        Alert.alert(
          'Fehler',
          'Bitte tragen Sie zuerst Ihren Namen in den Einstellungen ein.',
          [
            {
              text: 'Zu Einstellungen',
              onPress: () => router.push('/settings'),
            },
            {
              text: 'Abbrechen',
              style: 'cancel',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      Alert.alert('Fehler', 'Benutzerdaten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await getChatConversations(currentUserId);
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleStartChat = () => {
    if (!newChatUserId.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine Benutzer-ID ein.');
      return;
    }

    if (newChatUserId.trim() === currentUserId) {
      Alert.alert('Fehler', 'Sie können nicht mit sich selbst chatten.');
      return;
    }

    router.push({
      pathname: '/chat',
      params: {
        userId: newChatUserId.trim(),
        userName: newChatUserId.trim(),
      },
    });
    setNewChatUserId('');
    setShowNewChatInput(false);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `Vor ${minutes} Min`;
    if (hours < 24) return `Vor ${hours} Std`;
    if (days < 7) return `Vor ${days} Tag${days > 1 ? 'en' : ''}`;
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Chats' }} />
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
          title: 'Chats',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowNewChatInput(!showNewChatInput)}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          ),
        }}
      />

      {showNewChatInput && (
        <View style={[styles.newChatContainer, { backgroundColor: themeColors.surfaceElevated }]}>
          <TextInput
            style={[
              styles.newChatInput,
              isDark && styles.newChatInputDark,
              { color: isDark ? '#fff' : '#000' },
            ]}
            value={newChatUserId}
            onChangeText={setNewChatUserId}
            placeholder="Benutzer-ID eingeben..."
            placeholderTextColor={isDark ? '#888' : '#999'}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.newChatButton, { backgroundColor: DesignSystem.colors.primary.main }]}
            onPress={handleStartChat}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={themeColors.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Noch keine Chats
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
              Tippen Sie auf das + Symbol, um einen neuen Chat zu starten
            </ThemedText>
          </View>
        ) : (
          conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.userId}
              style={[
                styles.conversationItem,
                { backgroundColor: themeColors.surfaceElevated },
                conversation.unreadCount > 0 && styles.conversationItemUnread,
              ]}
              onPress={() => {
                router.push({
                  pathname: '/chat',
                  params: {
                    userId: conversation.userId,
                    userName: conversation.userName,
                  },
                });
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: DesignSystem.colors.primary.main }]}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <ThemedText
                    style={[
                      styles.conversationName,
                      { color: themeColors.text },
                      conversation.unreadCount > 0 && styles.conversationNameUnread,
                    ]}
                  >
                    {conversation.userName}
                  </ThemedText>
                  {conversation.lastMessageTime && (
                    <ThemedText
                      style={[styles.conversationTime, { color: themeColors.textSecondary }]}
                    >
                      {formatTime(conversation.lastMessageTime)}
                    </ThemedText>
                  )}
                </View>
                {conversation.lastMessage && (
                  <ThemedText
                    style={[styles.conversationMessage, { color: themeColors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage}
                  </ThemedText>
                )}
              </View>
              {conversation.unreadCount > 0 && (
                <View
                  style={[
                    styles.unreadBadge,
                    { backgroundColor: DesignSystem.colors.primary.main },
                  ]}
                >
                  <ThemedText style={styles.unreadBadgeText}>
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  headerButton: {
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
  },
  newChatContainer: {
    flexDirection: 'row',
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[200],
  },
  newChatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[300],
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
  },
  newChatInputDark: {
    borderColor: DesignSystem.colors.neutral[600],
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: DesignSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...DesignSystem.shadows.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignSystem.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xl * 2,
  },
  emptyText: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginTop: DesignSystem.spacing.md,
  },
  emptySubtext: {
    fontSize: DesignSystem.typography.fontSize.sm,
    marginTop: DesignSystem.spacing.xs,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.sm,
  },
  conversationItemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: DesignSystem.colors.primary.main,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: DesignSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  conversationName: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    flex: 1,
  },
  conversationNameUnread: {
    fontWeight: DesignSystem.typography.fontWeight.bold,
  },
  conversationTime: {
    fontSize: DesignSystem.typography.fontSize.xs,
  },
  conversationMessage: {
    fontSize: DesignSystem.typography.fontSize.sm,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: DesignSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xs,
    marginLeft: DesignSystem.spacing.sm,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.xs,
    fontWeight: DesignSystem.typography.fontWeight.bold,
  },
});

