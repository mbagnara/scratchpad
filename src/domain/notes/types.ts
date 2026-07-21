import type { Block } from '@blocknote/core';

export interface Note {
  id: string;
  title: string;
  /** False while the title is auto-derived from content; true once the user edits it directly. */
  isTitleCustom: boolean;
  content: Block[];
  tags: string[];
  isFavorite: boolean;
  /** Legacy storage name; represents membership in the user's Focus working set. */
  isPinned: boolean;
  /** One-based priority inside Focus. Lower numbers are more important. */
  focusOrder?: number;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NoteFilter {
  archived?: boolean;
  favorite?: boolean;
  pinned?: boolean;
  tag?: string;
}

export type NoteInput = Partial<Pick<Note, 'title' | 'content' | 'tags' | 'isTitleCustom'>>;
