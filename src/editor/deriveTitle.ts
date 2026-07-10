import type { Block } from '@blocknote/core';
import { extractPlainText } from './extractPlainText';

const MAX_TITLE_LENGTH = 40;
const MIN_BREAK_POINT = 20;

export function deriveTitleFromContent(blocks: Block[]): string {
  const text = extractPlainText(blocks).trim();
  if (!text) return '';
  if (text.length <= MAX_TITLE_LENGTH) return text;

  const truncated = text.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  const cut = lastSpace > MIN_BREAK_POINT ? truncated.slice(0, lastSpace) : truncated;
  return cut.trim() + '…';
}
