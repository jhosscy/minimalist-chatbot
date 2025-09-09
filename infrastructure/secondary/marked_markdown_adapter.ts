import { Marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import type { MarkdownPort } from '@domain/ports/markdown_port.ts';

const renderer = new Renderer();

renderer.code = (code) => {
  return code.text;
}

export function createMarkedMarkdownAdapter(): MarkdownPort {
  const htmlParser = new Marked(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlightedCode = hljs.highlight(code, { language }).value;
        try {
          return `
            <div class="code-block-container">
              <div class="code-header">
                <span class="code-language">${language}</span>
              </div>
              <pre><code class="hljs language-${language}">${highlightedCode}</code></pre>
            </div>
          `;
        } catch (error) {
          return `
            <div class="code-block-container">
              <div class="code-header">
                <span class="code-language">${language}</span>
              </div>
              <pre><code class="hljs language-${language}">${code}</code></pre>
            </div>
          `;
        }
      }
    }),
    {
      renderer: renderer,
      gfm: true,
      pedantic: false,
      breaks: true,
    }
  );
  return {
    convertToHtml(markdown: string): string {
      try {
        const res = htmlParser.parse(markdown) as string;
        return res;
      } catch (error) {
        throw new Error(`Error rendering markdown: ${error}`)
      }
    },
  }
}
