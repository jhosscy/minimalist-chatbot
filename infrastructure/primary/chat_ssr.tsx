import { randomUUID } from 'node:crypto';
import { renderToString } from 'preact-render-to-string';
import { encode } from 'he';
import { ChatSsrPage } from '../ui/components/ChatPage.tsx';
import { ChatMessage } from '../ui/components/ChatResponse.tsx';
import createHeaders from '../http/headers.ts';
import type { ComponentChildren } from 'preact';
import type { MarkdownPort } from '../../domain/ports/markdown_port.ts';
import type { ChatService } from '../../application/ports/chat_service_port.ts';
import type { DatabasePort } from '../../domain/ports/database_port.ts';

type Compressor = (payload: string) => Promise<Uint8Array | Buffer>;

export function createChatSsrAdapter(
  chatService: ChatService,
  markdownAdapter: MarkdownPort,
  databasePort: DatabasePort
) {
  async function handleChatSsrPost(req: Request, encodingType: string, compressed: Compressor) {
    const formData = await req.formData();
    const userInput = (formData.get('prompt') as string)?.trim();
    const existingSessionId = (formData.get('session') as string)?.trim();
    const sessionId = existingSessionId || `chat:history:${randomUUID()}`;

    const chatHistoryResponse = !userInput
      ? await databasePort.getConversationMessages(existingSessionId)
      : await chatService.sendMessage(sessionId, userInput);

    const pageTree = renderToString(
      <ChatSsrPage sessionId={sessionId} isPromptEmpty={!userInput}>
        {chatHistoryResponse.map(({role, content}) => (
          <ChatMessage
            role={role}
            content={
              role === 'user'
                ? encode(content, { useNamedReferences: true })
                : markdownAdapter.convertToHtml(content)
            }
          />
        ))}
        <span id="end"></span>
      </ChatSsrPage>
    )
    return new Response((await compressed(pageTree)) as unknown as ArrayBuffer, createHeaders({
      ext: 'html',
      customHeaders: {
        'Content-Encoding': encodingType,
        'X-Content-Type-Options': 'nosniff'
      }
    }))
  };
  function handleChatSsrGet() {
    return new Response(renderToString(<ChatSsrPage/>), createHeaders({ ext: 'html' }))
  };
  return { handleChatSsrGet, handleChatSsrPost };
}
