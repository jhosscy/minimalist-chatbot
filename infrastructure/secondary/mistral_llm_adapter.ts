import { Mistral } from '@mistralai/mistralai';
import type { MessageOutputEntry } from '@mistralai/mistralai/models/components';
import type { LlmChatPort, ChatMessage } from '@domain/ports/llm_port.ts';

export function createMistralLlmAdapter(apiKey: string): LlmChatPort {
  const DEFAULT_MODEL = 'mistral-small-latest';
  const client = new Mistral({ apiKey });

  return {
    async generateResponse(messages: Array<ChatMessage>, modelKey?: string) {
      const model = (modelKey?.startsWith('mistral:') ? modelKey.split(':', 2)[1] : '') || DEFAULT_MODEL;
      const chatResponse = await client.beta.conversations.start({
        model,
        inputs: messages,
        store: false,
      })
      const assistantMessage = (chatResponse.outputs?.[0] as MessageOutputEntry).content as string;
      return assistantMessage;
    }
  }
}
