import type { ChatMessage } from '../../domain/ports/llm_port.ts';

export interface ChatService {
  sendMessage(sessionId: string, userMessage: string): Promise<Array<ChatMessage>>;
}
