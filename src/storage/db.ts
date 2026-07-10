import Dexie, { type Table } from 'dexie';
import type { Note } from '../domain/notes/types';
import type { Attachment } from '../domain/attachments/types';

export class NotebookDB extends Dexie {
  notes!: Table<Note, string>;
  attachments!: Table<Attachment, string>;

  constructor() {
    super('notebook-db');
    this.version(1).stores({
      notes: 'id, title, updatedAt, isArchived, isFavorite, isPinned, *tags',
    });
    this.version(2).stores({
      notes: 'id, title, updatedAt, isArchived, isFavorite, isPinned, *tags',
      attachments: 'id, noteId',
    });
  }
}

export const db = new NotebookDB();
