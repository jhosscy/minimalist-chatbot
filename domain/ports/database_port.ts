import type { ChatMessage } from './llm_port.ts';

export interface DatabasePort {
  appendMessages(sessionId: string, ...messages: Array<string>): Promise<void>;
  getConversationMessages(sessionId: string): Promise<Array<ChatMessage>>;
}
