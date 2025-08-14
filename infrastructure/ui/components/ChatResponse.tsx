import { encode } from 'he';
import type { ComponentChildren } from 'preact';
import type { MarkdownPort } from '../../domain/ports/markdown_port.ts';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <article class={`chat-message chat-message--${role}`} aria-label={role}>
      <div class="marked-content" dangerouslySetInnerHTML={{ __html: content }}></div>
    </article>
  );
}

interface ChatResponseProps {
  chatHistory: Array<ChatMessageProps>;
  markdownAdapter: MarkdownPort;
}

export function ChatResponse({ chatHistory, markdownAdapter }: ChatResponseProps) {
  return (
    <>
      {chatHistory.map(({ role, content }) => (
        <ChatMessage role={role} content={role === 'user' ? encode(content, { useNamedReferences: true }) : markdownAdapter.convertToHtml(content)} />
      ))}
    </>
  );
}
