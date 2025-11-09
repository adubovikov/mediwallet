// Typdefinitionen für Chat-Nachrichten

export interface ChatMessage {
  id: number;
  senderId: string; // Eindeutige ID des Absenders (z.B. user_name oder user_id)
  receiverId: string; // Eindeutige ID des Empfängers
  message: string;
  createdAt: string;
  read: boolean; // Ob die Nachricht gelesen wurde
}

export interface NewChatMessage {
  senderId: string;
  receiverId: string;
  message: string;
}

export interface ChatConversation {
  userId: string;
  userName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

