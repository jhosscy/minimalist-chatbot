import { Groq } from 'groq-sdk';
import type { LlmChatPort, ChatMessage } from '@domain/ports/llm_port.ts';

export function createGroqLlmAdapter(apiKey: string): LlmChatPort {
  const groq = new Groq({ apiKey });
  const DEFAULT_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct';

  return {
    async generateResponse(messages: Array<ChatMessage>, modelKey?: string) {
      const model = (modelKey?.startsWith('groq:') ? modelKey.split(':', 2)[1] : '') || DEFAULT_MODEL;
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model,
        temperature: 1,
        top_p: 1,
        stop: null
      });
      const assistantMessage = chatCompletion.choices[0]?.message?.content || '';
      return assistantMessage;
    }
  }
}
