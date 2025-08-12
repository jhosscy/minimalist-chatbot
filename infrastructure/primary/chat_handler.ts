import { randomUUID } from 'node:crypto';
import { renderToString } from 'preact-render-to-string';
import { encode } from 'he';
import { ChatMessage } from '../ui/components/ChatResponse.tsx';
import createHeaders from '../http/headers.ts';
import type { MarkdownPort } from '../../domain/ports/markdown_port.ts';
import type { ChatService } from '../../application/ports/chat_service_port.ts';
import type { DatabasePort } from '../../domain/ports/database_port.ts';

type Compressor = (payload: string) => Promise<Uint8Array | Buffer>;

export function createChatAdapter(
  chatService: ChatService,
  markdownAdapter: MarkdownPort,
  databasePort: DatabasePort
) {
  async function handleChat(req: Request, html: string, encodingType: string, compressed: Compressor) {
    const formData = await req.formData();
    const userInput = (formData.get('prompt') as string)?.trim();
    const existingSessionId = (formData.get('session') as string)?.trim();
    const sessionId = existingSessionId || `chat:history:${randomUUID()}`;

    const chatHistoryResponse = !userInput ? await databasePort.getConversationMessages(existingSessionId) : await chatService.sendMessage(sessionId, userInput);

    const chatMessagesHtml = chatHistoryResponse.map(({role, content}) => {
      const formattedContent = role === 'user' ? encode(content, { useNamedReferences: true }) : markdownAdapter.convertToHtml(content);
      return renderToString(ChatMessage({ role, content: formattedContent }))
    }).join('\n');


    const rewriteHistory = new HTMLRewriter().on("section.chat-history", {
      async element(element) {
        element.append(chatMessagesHtml, { html: true })
        element.append(`<span id="end"></span>`, { html: true })
      }
    });

    const rewriteSession = new HTMLRewriter().on("input#session-uuid", {
      element(element) {
        element.replace(`<input type="hidden" name="session" value="${sessionId}" id="session-uuid" />`, { html: true })
      }
    });

    const withHistory = rewriteHistory.transform(html);
    let finalHtml = rewriteSession.transform(withHistory);

    if (!userInput) {
      finalHtml = new HTMLRewriter().on("textarea#prompt-input", {
        element(element) {
          element.setAttribute('placeholder', 'El mensaje no puede estar vacío…');
          element.setAttribute('class', 'chat-form__input chat-form__input--invalid');
        }
      }).transform(finalHtml);

      finalHtml = new HTMLRewriter().on("section.chat-form", {
        element(element) {
          element.setAttribute('class', 'chat-form chat-form__invalid')
        }
      }).transform(finalHtml);
    }

    return new Response((await compressed(finalHtml)) as unknown as ArrayBuffer, createHeaders({
      ext: 'html',
      customHeaders: {
        'Content-Encoding':  encodingType,
        'X-Content-Type-Options': 'nosniff'
      }
    }));
  }
  return { handleChat };
}
