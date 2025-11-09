import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DesignSystem, getThemeColors } from '@/constants/design';
import { getChatMessages, sendChatMessage, markChatMessagesAsRead, getUserSettings } from '@/services/database';
import { ChatMessage } from '@/types/chat-message';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; userName?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = getThemeColors(isDark);
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const otherUserId = params.userId || '';
  const otherUserName = params.userName || params.userId || 'Unbekannt';

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && otherUserId) {
      loadMessages();
      // Markiere Nachrichten als gelesen
      markChatMessagesAsRead(otherUserId, currentUserId);
      
      // Auto-Refresh alle 2 Sekunden
      const interval = setInterval(() => {
        loadMessages();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [currentUserId, otherUserId]);

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

  const loadMessages = async () => {
    if (!currentUserId || !otherUserId) {
      console.log('Cannot load messages: missing userIds', { currentUserId, otherUserId });
      return;
    }
    
    try {
      console.log('Loading messages for:', { currentUserId, otherUserId });
      const chatMessages = await getChatMessages(currentUserId, otherUserId);
      console.log('Loaded messages:', chatMessages.length, chatMessages);
      
      // Stelle sicher, dass Nachrichten korrekt sortiert sind
      const sortedMessages = [...chatMessages].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });
      
      console.log('Setting messages:', sortedMessages.length);
      setMessages(sortedMessages);
      
      // Scroll zum Ende nach kurzer Verzögerung
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Keine Alert bei Auto-Refresh, nur bei manuellem Laden
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !otherUserId || sending) {
      return;
    }

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage(''); // Sofort leeren für bessere UX
    
    try {
      console.log('Sending message:', { 
        senderId: currentUserId, 
        receiverId: otherUserId, 
        message: messageText 
      });
      const messageId = await sendChatMessage({
        senderId: currentUserId,
        receiverId: otherUserId,
        message: messageText,
      });
      console.log('Message sent successfully with ID:', messageId);
      
      // Nachrichten sofort neu laden
      setTimeout(async () => {
        await loadMessages();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Nachricht wiederherstellen bei Fehler
      setNewMessage(messageText);
      Alert.alert('Fehler', 'Nachricht konnte nicht gesendet werden.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Chat' }} />
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
          title: otherUserName,
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={themeColors.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                Noch keine Nachrichten
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
                Beginnen Sie die Unterhaltung mit {otherUserName}
              </ThemedText>
            </View>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              // Stelle sicher, dass die Nachricht nicht leer ist und keine Debug-Ausgabe enthält
              const messageText = message.message && typeof message.message === 'string' 
                ? message.message.trim() 
                : '';
              
              if (!messageText) {
                console.warn('Empty message detected:', message);
                return null;
              }
              
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    isOwnMessage ? styles.messageWrapperOwn : styles.messageWrapperOther,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isOwnMessage
                        ? [styles.messageBubbleOwn, { backgroundColor: DesignSystem.colors.primary.main }]
                        : [styles.messageBubbleOther, { backgroundColor: themeColors.surfaceElevated }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: isOwnMessage ? '#fff' : themeColors.text },
                      ]}
                      numberOfLines={0}
                    >
                      {messageText || '(Keine Nachricht)'}
                    </Text>
                    <ThemedText
                      style={[
                        styles.messageTime,
                        { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary },
                      ]}
                    >
                      {formatTime(message.createdAt)}
                    </ThemedText>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: themeColors.surface, borderTopColor: themeColors.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              isDark && styles.inputDark,
              { color: isDark ? '#fff' : '#000', backgroundColor: themeColors.surfaceElevated },
            ]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Nachricht eingeben..."
            placeholderTextColor={isDark ? '#888' : '#999'}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: DesignSystem.colors.primary.main },
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <Ionicons name="hourglass-outline" size={24} color="#fff" />
            ) : (
              <Ionicons name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginLeft: DesignSystem.spacing.sm,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.lg,
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
  messageWrapper: {
    marginBottom: DesignSystem.spacing.sm,
    flexDirection: 'row',
  },
  messageWrapperOwn: {
    justifyContent: 'flex-end',
  },
  messageWrapperOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    ...DesignSystem.shadows.sm,
  },
  messageBubbleOwn: {
    borderBottomRightRadius: DesignSystem.borderRadius.xs,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: DesignSystem.borderRadius.xs,
  },
  messageText: {
    fontSize: DesignSystem.typography.fontSize.base,
    lineHeight: DesignSystem.typography.lineHeight.relaxed,
    marginBottom: DesignSystem.spacing.xs,
    flexShrink: 1,
  },
  messageTime: {
    fontSize: DesignSystem.typography.fontSize.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: DesignSystem.spacing.md,
    borderTopWidth: 1,
    gap: DesignSystem.spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[300],
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
    maxHeight: 100,
    minHeight: 44,
  },
  inputDark: {
    borderColor: DesignSystem.colors.neutral[600],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: DesignSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...DesignSystem.shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

