import type { ChatMessage } from './llm_port.ts';

export interface ConversationMeta {
  createdAt: string;
  messagesKey: string;
  title: string;
  model: string;
  updatedAt: string;
}

export interface DatabasePort {
  appendMessages(sessionId: string, title: string, model: string, shouldPersistMeta: boolean, ...contents: Array<string>): Promise<void>;
  getConversationMessages(sessionId: string): Promise<Array<ChatMessage>>;
  getConversations(): Promise<Array<ConversationMeta>>;
  deleteConversations(keys: Array<string>): Promise<void>;
}
