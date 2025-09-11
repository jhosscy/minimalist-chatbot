import { randomUUID } from 'node:crypto';
import { renderToString } from 'preact-render-to-string';
import { encode } from 'he';
import { ChatSsrPage } from '@components/ChatPage.tsx';
import { ChatMessageItem } from '@components/ChatResponse.tsx';
import { EmptyChat } from '@components/EmptyChat.tsx';
import createHeaders from '../http/headers.ts';
import type { MarkdownPort } from '@domain/ports/markdown_port.ts';
import type { ChatServicePort } from '@application/ports/chat_service_port.ts';
import type { DatabasePort } from '@domain/ports/database_port.ts';

type Compressor = (payload: string) => Promise<Uint8Array | Buffer>;

export function createChatSsrAdapter(
  chatServicePort: ChatServicePort,
  markdownAdapter: MarkdownPort,
  databasePort: DatabasePort
) {
  async function handleChatSsrPost(req: Request) {
    const formData = await req.formData();
    const userInput = (formData.get('prompt') as string)?.trim();
    const temporaryChat = formData.get('temporary-chat');
    const modelKey = (formData.get('model') as string) || undefined;
    const sessionId = (req as any).params.id;

    userInput && await chatServicePort.sendMessage(sessionId, userInput, !!temporaryChat, modelKey);

    let url = `/chat/c/${sessionId}`;
    const params = [];

    params.push(`model=${modelKey}`);
    if (!userInput) params.push('prompt=empty');
    if (temporaryChat) params.push('temporary-chat=true');
    if (params.length) url += '?' + params.join('&');

    url += '#end';

    return Response.redirect(url, 303);
  };
  async function handleChatSsrGet(req: Request, encodingType: string, compressor: Compressor) {
    const url = new URL(req.url);
    const empty = url.searchParams.get('prompt');
    const temporaryChat = url.searchParams.get('temporary-chat') === 'true';
    const model = url.searchParams.get('model');
    const sessionId = (req as any).params.id || `${randomUUID()}`;
    const conversations = await databasePort.getConversations();
    const chatHistoryResponse = await databasePort.getConversationMessages(sessionId);
    const isNewChatPage = url.pathname === '/chat';

    const isEmptyState = chatHistoryResponse.length === 0 && !isNewChatPage;
    const pageTree = renderToString(
      <ChatSsrPage
        sessions={conversations}
        sessionId={sessionId}
        model={model}
        isPromptEmpty={empty === 'empty'}
        isNewChatPage={isNewChatPage}
        isTemporaryChat={temporaryChat}
        isEmptyState={isEmptyState}
      >
        {
          isEmptyState
            ? <EmptyChat />
            : <>
                {chatHistoryResponse.map(({ role, content }) => (
                  <ChatMessageItem
                    role={role}
                    content={
                      role === 'user'
                        ? encode(content, { useNamedReferences: true })
                        : markdownAdapter.convertToHtml(content)
                    }
                  />
                ))}
                <span id="end"></span>
              </>
        }
      </ChatSsrPage>
    )
    return new Response((await compressor(pageTree)) as unknown as ArrayBuffer, createHeaders({
      ext: 'html',
      customHeaders: {
        'Content-Encoding': encodingType,
        'X-Content-Type-Options': 'nosniff'
      }
    }));
  };
  return { handleChatSsrGet, handleChatSsrPost };
}
