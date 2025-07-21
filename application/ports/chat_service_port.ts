export interface ChatService {
  sendMessage(sessionId: string, userMessage: string): Promise<string>;
}
