import type { ChatMessage } from '@domain/ports/llm_port.ts';

export interface ChatServicePort {
  sendMessage(sessionId: string, userMessage: string, isTemporary: boolean, modelKey?: string): Promise<Array<ChatMessage>>;
}
