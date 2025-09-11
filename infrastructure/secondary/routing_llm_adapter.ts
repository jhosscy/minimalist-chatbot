import type { LlmChatPort, ChatMessage } from '@domain/ports/llm_port.ts';

export type ProviderId = 'mistral' | 'groq';

export function createRoutingLlmAdapter(registry: Record<ProviderId, LlmChatPort>, fallback: ProviderId = 'mistral'): LlmChatPort {
  return {
    async generateResponse(messages: Array<ChatMessage>, modelKey: string): Promise<string> {
      // modelKey expected format: "provider:model"
      const [provider] = (modelKey).split(':') as [ProviderId, string?];
      const chosen = (provider && registry[provider]) ? registry[provider] : registry[fallback];
      return chosen.generateResponse(messages, modelKey);
    }
  };
}
