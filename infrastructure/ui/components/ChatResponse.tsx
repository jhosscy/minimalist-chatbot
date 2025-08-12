import type { ComponentChildren } from 'preact';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const articleProps = {
    class: `chat-message chat-message--${role}`,
    'aria-label': role
  };

  return (
    <article {...articleProps}>
      <div class="marked-content" dangerouslySetInnerHTML={{ __html: content }}></div>
    </article>
  );
}

interface ChatResponseProps {
  userMessageHtml: string;
  assistantMessageHtml: string;
}

export function ChatResponse({ userMessageHtml, assistantMessageHtml }: ChatResponseProps) {
  return (
    <>
      <ChatMessage role="user" content={userMessageHtml} />
      <ChatMessage role="assistant" content={assistantMessageHtml} />
    </>
  );
}
