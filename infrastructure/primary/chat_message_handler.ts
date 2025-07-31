import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { renderToString } from 'preact-render-to-string';
import { encode } from 'he';
import { ChatResponse, ChatMessage } from '../ui/components/ChatResponse.tsx';
import createHeaders from '../http/headers.ts';
import type { Transform } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { MarkdownPort } from '../../domain/ports/markdown_port.ts';
import type { ChatService } from '../../application/ports/chat_service_port.ts';

export function createChatMessageAdapter(
  chatService: ChatService,
  markdownAdapter: MarkdownPort
) {
  async function handleChatMessage(req: Request, encodingType: string, compressionsStream: Transform) {
    const formData = await req.formData();
    const userInput = (formData.get('prompt') as string)?.trim();
    const existingSessionId = (formData.get('session') as string)?.trim();
    const sessionId = existingSessionId || `chat:history:${randomUUID()}`;

    const initialHtml = renderToString(
      ChatResponse({
        userMessageHtml: encode(userInput, { useNamedReferences: true }),
        sessionId: sessionId,
        isNewSession: !existingSessionId
      }),
    );

    const chatStream = new ReadableStream({
      async start(controller) {
        const BOUNDARY = '<!-- FRAGMENT_END -->';
        controller.enqueue(initialHtml + BOUNDARY);
        
        const assistantReply = await chatService.sendMessage(sessionId, userInput);
        const assistantHtml = renderToString(
          ChatMessage({
            role: 'assistant',
            content: markdownAdapter.convertToHtml(assistantReply)
          })
        );
        controller.enqueue(assistantHtml + BOUNDARY);
        controller.close();
      }
    });

    const encodedStream = chatStream.pipeThrough(new TextEncoderStream()) as unknown as WebReadableStream<Uint8Array>;
    const nodeReadable = Readable.fromWeb(encodedStream);

    const compressed = nodeReadable.pipe(compressionsStream) as unknown as ReadableStream<Uint8Array>;
    return new Response(compressed, createHeaders({
      ext: 'html',
      customHeaders: {
        'Content-Encoding':  encodingType,
        'X-Content-Type-Options': 'nosniff'
      }
    }));
  };

  return { handleChatMessage }
}
