// Typdefinitionen für plattformspezifisches Datenbankmodul
// React Native Resolver wählt automatisch database.native.ts oder database.web.ts zur Laufzeit aus

import { TestResult, NewTestResult } from '@/types/test-result';

export function initDatabase(): Promise<void>;
export function saveImage(sourceUri: string): Promise<string>;
export function addTestResult(testResult: NewTestResult): Promise<number>;
export function getAllTestResults(): Promise<TestResult[]>;
export function getTestResultById(id: number): Promise<TestResult | null>;
export function updateTestResult(
  id: number,
  updates: Partial<Omit<TestResult, 'id' | 'createdAt'>>
): Promise<void>;
export function deleteTestResult(id: number): Promise<void>;
export function getDatabaseStats(): Promise<{
  totalTests: number;
  totalSize: number;
}>;
export function getUserSettings(): Promise<import('@/types/user-settings').UserSettings | null>;
export function saveUserSettings(settings: import('@/types/user-settings').NewUserSettings): Promise<number>;
export function sendChatMessage(message: import('@/types/chat-message').NewChatMessage): Promise<number>;
export function getChatMessages(userId1: string, userId2: string): Promise<import('@/types/chat-message').ChatMessage[]>;
export function markChatMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
export function getChatConversations(userId: string): Promise<import('@/types/chat-message').ChatConversation[]>;

