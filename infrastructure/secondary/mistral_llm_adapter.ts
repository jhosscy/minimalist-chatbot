import { Mistral } from '@mistralai/mistralai';
import type { MessageOutputEntry } from '@mistralai/mistralai/models/components';
import type { LlmChatPort } from '../../domain/ports/llm_port.ts';

export function createMistralLlmAdapter(apiKey: string): LlmChatPort {
  const MODEL_NAME = 'mistral-small-latest';
  const client = new Mistral({ apiKey });

  return {
    async generateResponse(messages) {
      const chatResponse = await client.beta.conversations.start({
        model: MODEL_NAME,
        inputs: messages,
        store: false,
      })
      const assistantMessage = (chatResponse.outputs?.[0] as MessageOutputEntry).content as string;
      return assistantMessage;
    }
  }
}
