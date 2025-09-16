import { ChatSidebar } from './ChatSidebar.tsx';
import { ChatHeader } from './ChatHeader.tsx';
import { Toast } from './Toast.tsx';
import { ChatForm } from './ChatForm.tsx';
import type { ComponentChildren } from 'preact';
import type { ConversationMeta } from '@domain/ports/database_port.ts';

interface ChatSsrPageProps {
  children?: ComponentChildren;
  sessionId: string;
  isPromptEmpty: boolean;
  toast?: {
    message: string;
    icon: 'warning' | 'info' | 'success';
    tone: 'warning' | 'info' | 'success';
    role: 'alert' | 'status';
  };
  sessions?: Array<ConversationMeta>;
  isNewChatPage: boolean;
  isTemporaryChat: boolean;
  isEmptyState?: boolean;
  model: string;
}

export function ChatSsrPage({ children, sessionId, model, isPromptEmpty, toast, isNewChatPage, isTemporaryChat, isEmptyState = false, sessions = [] }: ChatSsrPageProps) {
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
        {toast && (
          <Toast {...toast} />
        )}

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
