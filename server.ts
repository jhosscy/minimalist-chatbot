import { brotliCompress, constants } from 'node:zlib';
import { promisify } from 'node:util';

import createHeaders from './headers.ts';
import { createRedisDatabaseAdapter } from './infrastructure/secondary/redis_adapter.ts';
import { createMistralLlmAdapter } from './infrastructure/secondary/mistral_llm_adapter.ts';
import { createMarkedMarkdownAdapter } from './infrastructure/secondary/marked_markdown_adapter.ts'
import { createChatMessageAdapter } from './infrastructure/primary/chat_message_handler.ts';
import { createChatUseCase } from './application/chat_use_case.ts';

const MISTRAL_API_KEY = Bun.env.MISTRAL_API_KEY ?? ''

const llmChatAdapter = createMistralLlmAdapter(MISTRAL_API_KEY);
const markdownAdapter = createMarkedMarkdownAdapter();
const databaseAdapter = createRedisDatabaseAdapter();

const chatService = createChatUseCase(llmChatAdapter, databaseAdapter);

const brotliCompressAsync = promisify(brotliCompress);

const { handleChatMessage } = createChatMessageAdapter(chatService, markdownAdapter);

Bun.serve({
  development: false,
  routes: {
    '/': async () => {
      const file = Bun.file('./src/dist/index.html');
      const App = await file.arrayBuffer();
      return new Response(App, createHeaders({ ext: 'html' }));
    },
    '/chat-message': {
      POST: async (req: Request) => handleChatMessage(req)
    }
  },
  async fetch(req: Request) {
    const pathname = new URL(req.url).pathname;
    const fileExtension = pathname.split('.').pop() || '';
    const filePath = `${process.cwd()}/src/dist${pathname}`;

    const compressedFile = Bun.file(`${filePath}.br`);
    const file = Bun.file(`${filePath}.br`);

    if (await compressedFile.exists()) {
      const fileBuffer = await compressedFile.arrayBuffer();
      return new Response(fileBuffer, createHeaders({
        ext: fileExtension,
        customHeaders: {
          'Content-Encoding': 'br',
          'X-Content-Type-Options': 'nosniff'
        }
      }));
    }

    const fileText = await Bun.file(filePath).text();
    return new Response(fileText, createHeaders({
      ext: fileExtension,
      customHeaders: {
        'X-Content-Type-Options': 'nosniff'
      }
    }))
  }
})
