/** Converts markdown into other representations. */
export interface MarkdownPort {
  convertToHtml(markdown: string): string;
}
