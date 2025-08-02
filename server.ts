import { brotliCompress, createBrotliCompress, createGzip, constants as zc } from 'node:zlib';
import { promisify } from 'node:util';
import { join } from 'node:path';
import * as Bowser from "bowser";
import { transform } from 'lightningcss';

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
  "ico", "bmp", "tiff", "ttf", "woff2"
]);

const EXT_FONTS = new Set(["ttf", "woff2"]);

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
      POST: async (req: Request) => {
        const browser = Bowser.getParser(req.headers.get('user-agent') ?? '');
        const isOldBrowser = browser.satisfies({
          chrome: '~95'
        });
        const compressionStream = isOldBrowser
          ? createGzip({
              flush: zc.Z_SYNC_FLUSH,
              finishFlush: zc.Z_SYNC_FLUSH,
            })
          : createBrotliCompress({
              params: {
                [zc.BROTLI_PARAM_QUALITY]: 1,
              },
            });
        const encodingType = isOldBrowser ? 'gzip' : 'br';
        return handleChatMessage(req, encodingType, compressionStream);
      }
    }
  },
  async fetch(req: Request) {
    const { pathname } = new URL(req.url);
    const fileExtension = pathname.split('.').pop() || '';
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    const ifNone = req.headers.get('if-none-match');
    const browser = Bowser.getParser(req.headers.get('user-agent') ?? '');
    const isOldBrowser = browser.satisfies({
      chrome: '~95'
    });

    const legacyOrModernDir = isOldBrowser ? '/js/legacy' : '/js/modern';
    const adjustedPath = pathname.replace('/js', legacyOrModernDir);
    const distPath = `${process.cwd()}/src/dist${adjustedPath}`;
    const srcPath = `${process.cwd()}/src${adjustedPath}`;

    const distFileTemp = Bun.file(distPath);
    if (!await distFileTemp.exists() && !RAW_EXTS.has(fileExtension)) {
      const { outputs } = await Bun.build({
        entrypoints: [srcPath],
        minify: fileExtension === 'css' ? false : true,
        naming: {
          entry: `${fileExtension === 'js' ? legacyOrModernDir : fileExtension}/[name].[ext]`,
        },
        define: { API_BASE: '' },
        drop: ['debugger'],
        external: ['../fonts/*']
      });

      const artifact = outputs[0];
      const outputPath = join(`${Bun.cwd}/src/dist`, artifact.path);
      let outputContent = await artifact.text();
      if (fileExtension === 'css') {
        let { code } = transform({
          code: Buffer.from(outputContent),
          minify: true
        });
        outputContent = code;
      }
      await Bun.write(outputPath, outputContent);
    }

    const preferredSrcPath = await Bun.file(`${srcPath}.br`).exists() ? `${srcPath}.br` : srcPath;
    const file = RAW_EXTS.has(fileExtension) ? Bun.file(preferredSrcPath) : Bun.file(distPath);
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

    if (acceptEncoding.includes('br') && fileBuffer.byteLength > MIN_COMPRESSION_SIZE_BYTES && !EXT_FONTS.has(fileExtension)) {
      const compressed = preferredSrcPath.endsWith('.br')
        ? fileBuffer
        : await brotliCompressAsync(fileBuffer, {
            params: {
              [zc.BROTLI_PARAM_QUALITY]: 11,
              [zc.BROTLI_PARAM_SIZE_HINT]: fileBuffer.byteLength,
            },
          });
      return new Response(compressed, createHeaders({
        ext: fileExtension,
        customHeaders: {
          'ETag': computedEtag,
          'Cache-Control': 'no-cache, must-revalidate',
          'Content-Encoding': 'br',
          'X-Content-Type-Options': 'nosniff'
        }
      }));
    }

    if (acceptEncoding.includes('gzip') && fileBuffer.byteLength > MIN_COMPRESSION_SIZE_BYTES && !EXT_FONTS.has(fileExtension)) {
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

    return new Response(fileBuffer, createHeaders({
      ext: fileExtension,
      customHeaders: {
        'ETag': computedEtag,
        'Cache-Control': EXT_FONTS.has(fileExtension) ? 'public, max-age=2592000, immutable' : 'no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    }));
  }
})
