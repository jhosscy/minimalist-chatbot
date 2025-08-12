import type { ChatService  } from './ports/chat_service_port.ts';
import type { LlmChatPort, ChatMessage } from '../domain/ports/llm_port.ts'
import type { DatabasePort } from '../domain/ports/database_port.ts'

export function createChatUseCase(llmPort: LlmChatPort, databasePort: DatabasePort): ChatService {
  return {
    async sendMessage(sessionId: string, userMessage: string): Promise<Array<ChatMessage>> {
      const previousMessages = await databasePort.getConversationMessages(sessionId);
      const conversationHistory: Array<ChatMessage> = [...previousMessages, { role: 'user', content: userMessage }];
      const assistantMessage = await llmPort.generateResponse(conversationHistory);
      await databasePort.appendMessages(sessionId, userMessage, assistantMessage);
      return [...conversationHistory, { role: 'assistant', content: assistantMessage }];
    }
  }
}
