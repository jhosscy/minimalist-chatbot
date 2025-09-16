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

      {/* Lista de conversaciones con selección múltiple */}
      <form class="sidebar__form" method="post" action="/chat/delete">
        <nav class="sidebar__nav" aria-label="Conversaciones">
          <ul class="sidebar__list" role="list">
            {sessions.length === 0 ? (
              <li class="sidebar__empty">Sin conversaciones aún</li>
            ) : (
              sortedSessions.map(({ title, model, updatedAt, messagesKey }) => {
                const isActive = `conv:${currentSessionId}:msgs` === messagesKey;
                const sessionId = messagesKey.split(':')[1];
                const checkboxId = `del-${sessionId}`;

                return (
                  <li key={messagesKey} class={`sidebar__item ${isActive ? 'is-active' : ''}`} title={title}>
                    <input
                      id={checkboxId}
                      class="sidebar__checkbox"
                      type="checkbox"
                      name="delete-ids"
                      value={sessionId}
                      hidden
                    />
                    <a
                      href={`/chat/c/${sessionId}?model=${model}`}
                      class="sidebar__link"
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
                    <label class="sidebar__delete-label" for={checkboxId} aria-label={`Seleccionar para eliminar “${title}”`} title="Seleccionar para eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      <span class="sr-only">Seleccionar para eliminar</span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </nav>

        <div class="sidebar__bulk">
          <button class="sidebar__bulk-delete" type="submit">
            Eliminar conversaciones seleccionadas
          </button>
        </div>
      </form>

      {/* Botón para plegar el sidebar en móvil */}
      <ToggleSidebar />
    </aside>
  );
}
