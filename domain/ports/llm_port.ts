export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Chat LLM interface returning full response.
export interface LlmChatPort {
  generateResponse(messages: Array<ChatMessage>, modelKey: string): Promise<string>;
}
