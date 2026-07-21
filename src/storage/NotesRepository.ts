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
    // Dexie's `.update()` resolves its `UpdateSpec<T>` parameter type (a dot-
    // notation map over every nested key path of T) just to pick an overload,
    // which recurses infinitely over BlockNote's self-referential `Block`
    // type (content contains `children: Block[]`) and trips TS's circularity
    // check — even with the argument cast to `any`. Route through a table
    // handle typed as `any` so `UpdateSpec` is never instantiated against
    // `Note` at all. We only ever pass flat partials.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = db.notes as any;
    await table.update(id, patch);
  }

  async updateMany(updates: Array<{ id: string; patch: Partial<Note> }>): Promise<void> {
    // Keep every priority change atomic so a reload cannot observe a partially
    // reordered Focus list.
    await db.transaction('rw', db.notes, async () => {
      const table = db.notes as any;
      await Promise.all(updates.map(({ id, patch }) => table.update(id, patch)));
    });
  }

  async delete(id: string): Promise<void> {
    await db.notes.delete(id);
  }
}
