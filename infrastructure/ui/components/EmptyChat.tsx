export function EmptyChat() {
  return (
    <section class="empty-chat" aria-labelledby="empty-chat-title" role="status" aria-live="polite">
      <div class="empty-chat__inner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="empty-chat__icon"><circle cx="16" cy="16" r="16" fill="#4F46E5"/><path d="M12 12h8M10 16h12M12 20h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
        <h1 id="empty-chat-title" class="empty-chat__title">No se puede ver el chat</h1>
        <p class="empty-chat__desc">Puede ser porque se eliminó o no existe.</p>
        <a class="empty-chat__cta" href="/chat">Comenzar nuevo chat</a>
      </div>
    </section>
  );
}
