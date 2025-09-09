import { encode } from 'he';
import type { ComponentChildren } from 'preact';
import type { MarkdownPort } from '@domain/ports/markdown_port.ts';

interface ChatMessageItemProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessageItem({ role, content }: ChatMessageItemProps) {
  return (
    <article class={`chat-message chat-message--${role}`} aria-label={role}>
      <div class="marked-content" dangerouslySetInnerHTML={{ __html: content }}></div>
    </article>
  );
}

interface ChatResponseProps {
  chatHistory: Array<ChatMessageItemProps>;
  markdownAdapter: MarkdownPort;
}

export function ChatResponse({ chatHistory, markdownAdapter }: ChatResponseProps) {
  return (
    <>
      {chatHistory.map(({ role, content }) => (
        <ChatMessageItem role={role} content={role === 'user' ? encode(content, { useNamedReferences: true }) : markdownAdapter.convertToHtml(content)} />
      ))}
    </>
  );
}
