import { brotliCompress, constants } from 'node:zlib';
import { promisify } from 'node:util';
import * as Bowser from "bowser";

import createHeaders from './infrastructure/http/headers.ts';
import { eTag, ifNoneMatch } from './infrastructure/http/etag.ts';
import { createRedisDatabaseAdapter } from './infrastructure/secondary/redis_adapter.ts';
import { createGroqLlmAdapter } from './infrastructure/secondary/groq_llm_adapter.ts';
import { createMarkedMarkdownAdapter } from './infrastructure/secondary/marked_markdown_adapter.ts'
import { createChatMessageAdapter } from './infrastructure/primary/chat_message_handler.ts';
import { createChatUseCase } from './application/chat_use_case.ts';

//const MISTRAL_API_KEY = Bun.env.MISTRAL_API_KEY ?? '';
const GROQ_API_KEY = Bun.env.GROQ_API_KEY ?? '';
const REDIS_UPSTASH_URL = Bun.env.REDIS_UPSTASH_URL ?? '';
const REDIS_UPSTASH_TOKEN = Bun.env.REDIS_UPSTASH_TOKEN ?? '';

const llmChatAdapter = createGroqLlmAdapter(GROQ_API_KEY);
const markdownAdapter = createMarkedMarkdownAdapter();
const databaseAdapter = createRedisDatabaseAdapter(REDIS_UPSTASH_URL, REDIS_UPSTASH_TOKEN);

const chatService = createChatUseCase(llmChatAdapter, databaseAdapter);

const brotliCompressAsync = promisify(brotliCompress);

const { handleChatMessage } = createChatMessageAdapter(chatService, markdownAdapter);

const RAW_EXTS = new Set([
  "png", "jpg", "jpeg", "webp", "gif", "svg", "avif",
  "ico", "bmp", "tiff"
]);

const MIN_COMPRESSION_SIZE_BYTES = 2 * 1024; // 2KB

Bun.serve({
  port: Bun.env.PORT ?? 3001,
  development: false,
  routes: {
    '/': async () => {
      const file = Bun.file('./src/index.html');
      const App = await file.text();
      return new Response(App, createHeaders({ ext: 'html' }));
    },
    '/chat-message': {
      POST: async (req: Request) => handleChatMessage(req)
    }
  },
  async fetch(req: Request) {
    const { pathname } = new URL(req.url);
    const fileExtension = pathname.split('.').pop() || '';
    const srcPath = `${process.cwd()}/src${pathname}`;
    const distPath = `${process.cwd()}/src/dist${pathname}`;
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    const ifNone = req.headers.get('if-none-match');
    const browser = Bowser.getParser(req.headers.get('user-agent') ?? '');
    const isOldBrowser = browser.satisfies({
      chrome: '~95'
    });

    const dir = isOldBrowser ? '/js/legacy' : '/js/modern';
    const targetPath = fileExtension === 'js' ? srcPath.replace('/js', dir) : srcPath;

    const buildFile = await Bun.build({
      entrypoints: [targetPath],
      minify: true,
    })

    const file = RAW_EXTS.has(fileExtension) ? Bun.file(targetPath) : await buildFile.outputs[0];
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    const computedEtag = await eTag(uint8Array);

    if (!ifNoneMatch(ifNone, computedEtag)) {
      return new Response(null, createHeaders({
        status: 304,
        customHeaders: {
          'ETag': computedEtag,
          'Cache-Control': 'no-cache, must-revalidate'
        }
      }))
    }

    const compressedFile = Bun.file(`${distPath}.br`);
    if (acceptEncoding.includes('br') && await compressedFile.exists()) {
      const fileBuffer = await compressedFile.arrayBuffer();
      return new Response(fileBuffer, createHeaders({
        ext: fileExtension,
        customHeaders: {
          'ETag': computedEtag,
          'Cache-Control': 'no-cache, must-revalidate',
          'Content-Encoding': 'br',
          'X-Content-Type-Options': 'nosniff'
        }
      }));
    }

    if (acceptEncoding.includes('gzip') && fileBuffer.byteLength > MIN_COMPRESSION_SIZE_BYTES) {
      const compressed = Bun.gzipSync(fileBuffer);
      return new Response(compressed, createHeaders({
        ext: fileExtension,
        customHeaders: {
          'ETag': computedEtag,
          'Cache-Control': 'no-cache, must-revalidate',
          'Content-Encoding': 'gzip',
          'X-Content-Type-Options': 'nosniff'
        }
      }))
    }

    const fileText = await file.text();
    return new Response(fileText, createHeaders({
      ext: fileExtension,
      customHeaders: {
        'ETag': computedEtag,
        'Cache-Control': 'no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    }))
  }
})
