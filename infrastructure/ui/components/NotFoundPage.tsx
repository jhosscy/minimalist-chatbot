export function NotFoundPage() {
  return (
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pagina no encontrada - ChatBot</title>
        <link rel="preload" href="/fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href="/css/styles.css" />
      </head>
      <body>
        <main>
          <section class="empty-chat" aria-labelledby="not-found-title">
            <div class="empty-chat__inner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="empty-chat__icon"><circle cx="16" cy="16" r="16" fill="#4F46E5"/><path d="M12 12h8M10 16h12M12 20h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
              <h1 id="empty-chat-title" class="empty-chat__title">Pagina no encontrada</h1>
              <a class="empty-chat__cta" href="/chat">Volver al inicio</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
