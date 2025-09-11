import { ToggleSidebar } from './ToggleSidebar.tsx';
import type { ConversationMeta } from '@domain/ports/database_port.ts';

interface ChatSidebarProps {
  sessions?: Array<ConversationMeta>;
  currentSessionId?: string;
}

export function ChatSidebar({ sessions = [], currentSessionId }: ChatSidebarProps) {
  const sortedSessions = sessions.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return (
    <aside id="sidebar" class="sidebar" aria-label="Historial de chats">
      <header class="sidebar__header">
        <h2 class="sidebar__title">Historial</h2>

        {/* Botón “Nuevo chat” */}
        <a class="sidebar__new button button--primary" href="/chat" aria-label="Nuevo chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
        </a>
      </header>

      {/* Lista de conversaciones */}
      <nav class="sidebar__nav" aria-label="Conversaciones">
        <ul class="sidebar__list" role="list">
          {sessions.length === 0 ? (
            <li class="sidebar__empty">Sin conversaciones aún</li>
          ) : (
            sortedSessions.map(({ title, model, updatedAt, messagesKey }) => {
              const isActive = `conv:${currentSessionId}:msgs` === messagesKey;

              return (
                <li key={messagesKey} class="sidebar__item" title={title}>
                  <a
                    href={`/chat/c/${messagesKey.split(':')[1]}?model=${model}`}
                    class={`sidebar__link ${isActive ? 'is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span class="sidebar__link-title">{title}</span>
                    {updatedAt && (
                      <time
                        class="sidebar__link-time"
                        dateTime={updatedAt}
                      >
                        {updatedAt.slice(0, 10)}
                      </time>
                    )}
                  </a>
                </li>
              );
            })
          )}
        </ul>
      </nav>

      {/* Botón para plegar el sidebar en móvil */}
      <ToggleSidebar />
    </aside>
  );
}
