import { brotliCompress, constants as zc } from 'node:zlib';
import { promisify } from 'node:util';
import { join } from 'node:path';
import Bowser from 'bowser';
import { transform } from 'lightningcss';
import { renderToString } from 'preact-render-to-string';

import Home from '@src/index.html' with { type: 'text' };
import { NotFoundPage } from '@components/NotFoundPage.tsx';

import createHeaders from '@infrastructure/http/headers.ts';
import { eTag, ifNoneMatch } from '@infrastructure/http/etag.ts';
import { createRedisDatabaseAdapter } from '@infrastructure/secondary/redis_adapter.ts';
// LLM adapters
import { createMistralLlmAdapter } from '@infrastructure/secondary/mistral_llm_adapter.ts';
import { createGroqLlmAdapter } from '@infrastructure/secondary/groq_llm_adapter.ts';
import { createRoutingLlmAdapter } from '@infrastructure/secondary/routing_llm_adapter.ts';
import { createMarkedMarkdownAdapter } from '@infrastructure/secondary/marked_markdown_adapter.ts'
import { createChatAdapter } from '@infrastructure/primary/chat_handler.ts';
import { createChatSsrAdapter } from '@infrastructure/primary/chat_ssr.tsx';
import { createChatUseCase } from '@application/chat_use_case.ts';

const MISTRAL_API_KEY = Bun.env.MISTRAL_API_KEY ?? '';
const GROQ_API_KEY = Bun.env.GROQ_API_KEY ?? '';
const REDIS_UPSTASH_URL = Bun.env.REDIS_UPSTASH_URL ?? '';
const REDIS_UPSTASH_TOKEN = Bun.env.REDIS_UPSTASH_TOKEN ?? '';

const mistralAdapter = createMistralLlmAdapter(MISTRAL_API_KEY);
const groqAdapter = createGroqLlmAdapter(GROQ_API_KEY);
const llmChatAdapter = createRoutingLlmAdapter({
  mistral: mistralAdapter,
  groq: groqAdapter,
}, 'groq');
const markdownAdapter = createMarkedMarkdownAdapter();
const databaseAdapter = createRedisDatabaseAdapter(REDIS_UPSTASH_URL, REDIS_UPSTASH_TOKEN);

const chatService = createChatUseCase(llmChatAdapter, databaseAdapter);

const brotliCompressAsync = promisify(brotliCompress);

const { handleChat } = createChatAdapter(chatService, markdownAdapter, databaseAdapter);
const { handleChatSsrGet, handleChatSsrPost } = createChatSsrAdapter(chatService, markdownAdapter, databaseAdapter);

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
    '/': {
      GET: () => {
        return new Response(Home as unknown as string, createHeaders({ ext: 'html' }));
      },
      POST: async (req: Request) => {
        const browser = Bowser.getParser(req.headers.get('user-agent') ?? '');
        const isOldBrowser = browser.satisfies({
          chrome: '~95'
        });
        const compressed = isOldBrowser
          ? async (content: string) => Bun.gzipSync(content)
          : (content: string) => brotliCompressAsync(content, {
              params: {
                [zc.BROTLI_PARAM_QUALITY]: 11,
                [zc.BROTLI_PARAM_SIZE_HINT]: content.length,
              },
            });
        const encodingType = isOldBrowser ? 'gzip' : 'br';
        return handleChat(req, Home as unknown as string, encodingType, compressed);
      }
    },
    '/chat': {
      GET: (req: Request) => {
        const browser = Bowser.getParser(req.headers.get('user-agent') ?? '');
        const isOldBrowser = browser.satisfies({
          chrome: '~95'
        });
        const compressed = isOldBrowser
          ? async (content: string) => Bun.gzipSync(content)
          : (content: string) => brotliCompressAsync(content, {
              params: {
                [zc.BROTLI_PARAM_QUALITY]: 11,
                [zc.BROTLI_PARAM_SIZE_HINT]: content.length,
              },
            });
        const encodingType = isOldBrowser ? 'gzip' : 'br';
        return handleChatSsrGet(req, encodingType, compressed);
      }
    },
    '/chat/c/:id': {
      GET: (req: Request) => {
        const browser = Bowser.getParser(req.headers.get('user-agent') ?? '');
        const isOldBrowser = browser.satisfies({
          chrome: '~95'
        });
        const compressed = isOldBrowser
          ? async (content: string) => Bun.gzipSync(content)
          : (content: string) => brotliCompressAsync(content, {
              params: {
                [zc.BROTLI_PARAM_QUALITY]: 11,
                [zc.BROTLI_PARAM_SIZE_HINT]: content.length,
              },
            });
        const encodingType = isOldBrowser ? 'gzip' : 'br';
        return handleChatSsrGet(req, encodingType, compressed);
      },
      POST: (req: Request) => handleChatSsrPost(req)
    },
  },
  async fetch(req: Request) {
    const { pathname } = new URL(req.url);
    const hasExtension = pathname.lastIndexOf('.') > pathname.lastIndexOf('/');
    if (!hasExtension) {
      return new Response(renderToString(NotFoundPage()), createHeaders({
        ext: 'html',
        status: 404,
        customHeaders: {
          'X-Content-Type-Options': 'nosniff'
        }
      }));
    };
    const fileExtension = pathname.split('.').pop() || '';
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    const ifNoneMatchHeader = req.headers.get('if-none-match');
    const browser = Bowser.getParser(req.headers.get('user-agent') ?? '');
    const isOldBrowser = browser.satisfies({
      chrome: '~95'
    });

    const legacyOrModernDir = isOldBrowser ? '/js/legacy' : '/js/modern';
    const adjustedPath = pathname.replace('/js', legacyOrModernDir);
    const distPath = `${process.cwd()}/src/dist${adjustedPath}`;
    const srcPath = `${process.cwd()}/src${adjustedPath}`;

    const distFile = Bun.file(distPath);
    if (!await distFile.exists() && !RAW_EXTS.has(fileExtension)) {
      try {
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
        const outputPath = join(`${process.cwd()}/src/dist`, artifact?.path ?? '');
        let outputContent: Uint8Array | string = await artifact?.text() ?? '';
        if (fileExtension === 'css') {
          let { code } = transform({
            code: Buffer.from(outputContent),
            minify: true,
            filename: ''
          });
          outputContent = code
        }
        await Bun.write(outputPath, outputContent);
      } catch {
        return new Response(renderToString(NotFoundPage()), createHeaders({
          ext: 'html',
          status: 404,
          customHeaders: {
            'X-Content-Type-Options': 'nosniff'
          }
        }));
      }
    }

    const preferredSrcPath = await Bun.file(`${srcPath}.br`).exists() ? `${srcPath}.br` : srcPath;
    const file = RAW_EXTS.has(fileExtension) ? Bun.file(preferredSrcPath) : Bun.file(distPath);
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    const computedEtag = await eTag(uint8Array);

    if (!ifNoneMatch(ifNoneMatchHeader, computedEtag)) {
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
      return new Response(compressed as unknown as ArrayBuffer, createHeaders({
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
