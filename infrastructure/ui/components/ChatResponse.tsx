import type { ComponentChildren } from 'preact';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content?: string;
  children?: ComponentChildren;
}

export function ChatMessage({ role, content, children }: ChatMessageProps) {
  const articleProps = {
    class: `chat-message chat-message--${role}`,
    'aria-label': role,
    ...(children && { 'data-loading': 'true' })
  };

  return (
    <article {...articleProps}>
      {children || (
        <div class="marked-content" dangerouslySetInnerHTML={{ __html: content ?? '' }}></div>
      )}
    </article>
  );
}

interface ChatResponseProps {
  userMessageHtml: string;
  sessionId: string;
  isNewSession: boolean;
}

export function ChatResponse({ userMessageHtml, sessionId, isNewSession }: ChatResponseProps) {
  return (
    <>
      <ChatMessage role="user" content={userMessageHtml} />
      <ChatMessage role="assistant">
        <div class="typing-indicator">
          <div class="typing-indicator__dot"></div>
          <div class="typing-indicator__dot"></div>
          <div class="typing-indicator__dot"></div>
          <div class="typing-indicator__dot"></div>
        </div>
      </ChatMessage>
      
      {isNewSession && (
        <input type="hidden" name="session" value={sessionId} id="session-uuid" swap-oob />
      )}
    </>
  );
}
