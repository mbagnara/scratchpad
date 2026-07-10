import type { Block } from '@blocknote/core';

function extractInlineText(content: unknown): string {
  if (!Array.isArray(content)) return '';
  let text = '';
  for (const item of content) {
    if (item && typeof item === 'object') {
      if ('text' in item && typeof item.text === 'string') {
        text += item.text + ' ';
      } else if ('content' in item) {
        text += extractInlineText((item as { content: unknown }).content) + ' ';
      }
    }
  }
  return text;
}

export function extractPlainText(blocks: Block[]): string {
  let text = '';
  for (const block of blocks) {
    text += extractInlineText((block as { content?: unknown }).content);
    const children = (block as { children?: Block[] }).children;
    if (children?.length) text += extractPlainText(children) + ' ';
  }
  return text.trim().replace(/\s+/g, ' ');
}
