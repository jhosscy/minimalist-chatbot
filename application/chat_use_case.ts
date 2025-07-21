import type { ChatService } from './ports/chat_service_port.ts';
import type { LlmChatPort } from '../domain/ports/llm_port.ts'
import type { DatabasePort } from '../domain/ports/database_port.ts'

export function createChatUseCase(llmPort: LlmChatPort, databasePort: DatabasePort): ChatService {
  return {
    async sendMessage(sessionId: string, userMessage: string): Promise<string> {
      const messages = await databasePort.getConversationMessages(sessionId);
      const assistantMessage = await llmPort.generateResponse([
        ...messages,
        { role: 'user', content: userMessage }
      ]);
      await databasePort.appendMessages(sessionId, userMessage, assistantMessage);
      return assistantMessage;
    }
  }
}
