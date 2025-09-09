import { ChatSidebar } from './ChatSidebar.tsx';
import { ChatHeader } from './ChatHeader.tsx';
import type { ComponentChildren } from 'preact';
import type { ChatSession } from './ChatSidebar.tsx'

interface ChatSsrPageProps {
  children?: ComponentChildren;
  sessionId: string;
  isPromptEmpty?: boolean;
  sessions?: Array<ChatSession>;
  isNewChatPage: boolean;
  isTemporaryChat: boolean;
  isEmptyState?: boolean;
}

export function ChatSsrPage({ children, sessionId, isPromptEmpty, isNewChatPage, isTemporaryChat, isEmptyState = false, sessions = [] }: ChatSsrPageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>ChatBot</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
        <link rel="preload" href="/fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
        <link rel="preload" href="/fonts/JetBrainsMonoVariable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
        <link rel="stylesheet" href="/css/styles.css"/>
      </head>
      <body>
        {
          isEmptyState ? (
            <main>
              {children}
            </main>
          ) : (
            <>
              <input id="sidebar-toggle" class="sidebar__toggle" type="checkbox" hidden />

              <ChatHeader isNewChatPage={isNewChatPage} />

              <ChatSidebar sessions={sessions} currentSessionId={sessionId} />

              <main>
                <section class="chat-history">
                  {children}
                </section>
              </main>

              <section class={`chat-form ${isPromptEmpty ? 'chat-form__invalid' : ''}`}>
                <form action={`/chat/c/${sessionId}#end`} method="post" autocomplete="off" novalidate>
                  <label for="prompt-input" class="sr-only">Enter your prompt</label>
                  <textarea
                    id="prompt-input"
                    class={`chat-form__input ${isPromptEmpty ? 'chat-form__input--invalid' : ''}`}
                    name="prompt"
                    placeholder={isPromptEmpty ? 'The message cannot be empty…' : 'Ask something…'}
                    aria-label="Chat input"
                    rows={1}
                    required
                  ></textarea>
                  {/*<input type="hidden" name="session" value={sessionId} id="session-uuid"/>*/}
                  <input id="temporary-toggle" class="switch__input" type="checkbox" name="temporary-chat" hidden checked={isTemporaryChat}/>
                  <button type="submit" class="chat-form__submit button button--primary">
                    <svg width="38" height="38" viewBox="-6 -8 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 2L11 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </form>
              </section>
              {/* Overlay: al hacer click aquí se togglea el checkbox (cierra). */}
              <label for="sidebar-toggle" class="sidebar__overlay" aria-hidden="true"></label>
            </>
          )
        }
      </body>
    </html>
  )
};
