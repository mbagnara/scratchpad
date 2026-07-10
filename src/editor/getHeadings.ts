import type { Block } from '@blocknote/core';
import { extractPlainText } from './extractPlainText';

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
}

export function getHeadings(blocks: Block[]): HeadingItem[] {
  const headings: HeadingItem[] = [];
  for (const block of blocks) {
    const b = block as unknown as {
      id: string;
      type: string;
      props?: { level?: number };
      children?: Block[];
    };
    if (b.type === 'heading') {
      headings.push({
        id: b.id,
        level: b.props?.level ?? 1,
        text: extractPlainText([block]) || 'Untitled',
      });
    }
    if (b.children?.length) headings.push(...getHeadings(b.children));
  }
  return headings;
}
