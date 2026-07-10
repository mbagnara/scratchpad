import type { BlockNoteEditor } from '@blocknote/core';
import { insertOrUpdateBlockForSlashMenu } from '@blocknote/core';
import { getDefaultReactSlashMenuItems } from '@blocknote/react';

export function getSlashMenuItems(editor: BlockNoteEditor<any, any, any>) {
  const items = getDefaultReactSlashMenuItems(editor);
  const calloutItem = {
    title: 'Callout',
    subtext: 'Highlighted block with an icon',
    aliases: ['callout', 'idea', 'warning', 'important', 'note', 'reference', 'success'],
    group: 'Basic blocks',
    icon: <span>💡</span>,
    onItemClick: () => {
      insertOrUpdateBlockForSlashMenu(editor, { type: 'callout' } as never);
    },
  };

  // Insert right after the last "Basic blocks" item so the group stays
  // contiguous (the menu renders one header per contiguous group run).
  const lastBasicBlockIndex = items.map((item) => item.group).lastIndexOf('Basic blocks');
  const insertAt = lastBasicBlockIndex === -1 ? items.length : lastBasicBlockIndex + 1;
  return [...items.slice(0, insertAt), calloutItem, ...items.slice(insertAt)];
}
