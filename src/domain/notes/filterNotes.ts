import type { Note } from './types';

export type SidebarFilter =
  | { type: 'recent' }
  | { type: 'favorites' }
  | { type: 'focus' }
  | { type: 'archive' }
  | { type: 'tag'; tag: string };

export function filterNotesForSidebar(notes: Note[], filter: SidebarFilter): Note[] {
  switch (filter.type) {
    case 'recent':
      return notes.filter((n) => !n.isArchived);
    case 'favorites':
      return notes.filter((n) => !n.isArchived && n.isFavorite);
    case 'focus':
      return notes
        .filter((n) => !n.isArchived && n.isPinned)
        .sort((a, b) => {
          const aOrder = Number.isFinite(a.focusOrder) ? a.focusOrder! : Number.MAX_SAFE_INTEGER;
          const bOrder = Number.isFinite(b.focusOrder) ? b.focusOrder! : Number.MAX_SAFE_INTEGER;
          return aOrder - bOrder || b.updatedAt - a.updatedAt;
        });
    case 'archive':
      return notes.filter((n) => n.isArchived);
    case 'tag':
      return notes.filter((n) => !n.isArchived && n.tags.includes(filter.tag));
  }
}

export function getAvailableTags(notes: Note[]): string[] {
  const tags = new Set<string>();
  for (const note of notes) {
    if (note.isArchived) continue;
    for (const tag of note.tags) tags.add(tag);
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}
