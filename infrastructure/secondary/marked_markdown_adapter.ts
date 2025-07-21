import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import type { MarkdownPort } from '../../domain/ports/markdown_port.ts';


export function createMarkedMarkdownAdapter(): MarkdownPort {
  const htmlParser = new Marked(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        try {
          return hljs.highlight(code, { language }).value
        } catch (error) {
          return code;
        }
      }
    }),
    {
      gfm: true,
      pedantic: false,
      breaks: true,
    }
  );
  return {
    convertToHtml(markdown) {
      try {
        const res = htmlParser.parse(markdown) as string;
        return res;
      } catch (error) {
        throw new Error(`Error rendering markdown: ${error}`)
      }
    },
  }
}
