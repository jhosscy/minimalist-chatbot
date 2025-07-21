import { randomUUID } from 'node:crypto';
import { renderToString } from 'preact-render-to-string';
import { ChatResponse, ChatMessage } from '../ui/components/ChatResponse.tsx';
import createHeaders from '../http/headers.ts';
import type { MarkdownPort } from '../../domain/ports/markdown_port.ts';
import type { ChatService } from '../../application/ports/chat_service_port.ts';

export function createChatMessageAdapter(
  chatService: ChatService,
  markdownAdapter: MarkdownPort
) {
  async function handleChatMessage(req: Request) {
    const formData = await req.formData();
    const userInput = (formData.get('prompt') as string)?.trim();
    const existingSessionId = (formData.get('session') as string)?.trim();
    const sessionId = existingSessionId || `chat:history:${randomUUID()}`;

    const initialHtml = renderToString(
      ChatResponse({
        userMessageHtml: markdownAdapter.convertToHtml(userInput),
        sessionId: sessionId,
        isNewSession: !existingSessionId
      }),
    );

    const chatStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(initialHtml);
        
        const assistantReply = await chatService.sendMessage(sessionId, userInput);
        const assistantHtml = renderToString(
          ChatMessage({
            role: 'assistant',
            content: markdownAdapter.convertToHtml(assistantReply)
          })
        );
        controller.enqueue(assistantHtml);
        controller.close();
      }
    });

    const encodedStream = chatStream.pipeThrough(new TextEncoderStream());

    return new Response(encodedStream, createHeaders({ ext: 'html' }));
  };

  return { handleChatMessage }
}
