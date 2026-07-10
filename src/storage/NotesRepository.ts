import { db } from './db';
import type { NotesRepository } from '../domain/notes/NotesRepository';
import type { Note, NoteFilter } from '../domain/notes/types';

export class DexieNotesRepository implements NotesRepository {
  async add(note: Note): Promise<void> {
    await db.notes.add(note);
  }

  async get(id: string): Promise<Note | undefined> {
    return db.notes.get(id);
  }

  async list(filter: NoteFilter = {}): Promise<Note[]> {
    let notes = await db.notes.orderBy('updatedAt').reverse().toArray();

    if (filter.archived !== undefined) {
      notes = notes.filter((n) => n.isArchived === filter.archived);
    }
    if (filter.favorite !== undefined) {
      notes = notes.filter((n) => n.isFavorite === filter.favorite);
    }
    if (filter.pinned !== undefined) {
      notes = notes.filter((n) => n.isPinned === filter.pinned);
    }
    if (filter.tag) {
      notes = notes.filter((n) => n.tags.includes(filter.tag!));
    }

    return notes;
  }

  async update(id: string, patch: Partial<Note>): Promise<void> {
    await db.notes.update(id, patch);
  }

  async delete(id: string): Promise<void> {
    await db.notes.delete(id);
  }
}
