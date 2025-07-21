import { Groq } from 'groq-sdk';
import type { LlmChatPort } from '../../domain/ports/llm_port.ts';


export function createGroqLlmAdapter(apiKey: string): LlmChatPort {
  const groq = new Groq({ apiKey });
  const MODEL_NAME = 'meta-llama/llama-4-maverick-17b-128e-instruct';

  return {
    async generateResponse(messages) {
      const chatCompletion = await groq.chat.completions.create({
        "messages": messages,
        "model": MODEL_NAME,
        "temperature": 1,
        "top_p": 1,
        "stop": null
      });
      const assistantMessage = chatCompletion.choices[0]?.message?.content || "";
      return assistantMessage;
    }
  }
}
