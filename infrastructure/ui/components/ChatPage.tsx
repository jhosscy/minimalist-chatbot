import { ChatSidebar } from './ChatSidebar.tsx';
import { ChatHeader } from './ChatHeader.tsx';
import { ChatForm } from '@components/ChatForm.tsx';
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
  model: string;
}

export function ChatSsrPage({ children, sessionId, model, isPromptEmpty, isNewChatPage, isTemporaryChat, isEmptyState = false, sessions = [] }: ChatSsrPageProps) {
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

              <ChatForm action={`/chat/c/${sessionId}#end`} isPromptEmpty={isPromptEmpty} isTemporaryChat={isTemporaryChat} model={model}/>
              {/* Overlay: al hacer click aquí se togglea el checkbox (cierra). */}
              <label for="sidebar-toggle" class="sidebar__overlay" aria-hidden="true"></label>
            </>
          )
        }
      </body>
    </html>
  )
};
