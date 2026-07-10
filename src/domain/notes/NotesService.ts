import { v4 as uuid } from 'uuid';
import type { NotesRepository } from './NotesRepository';
import type { Note, NoteFilter, NoteInput } from './types';

export class NotesService {
  constructor(private repo: NotesRepository) {}

  async create(input: NoteInput = {}): Promise<Note> {
    const now = Date.now();
    const note: Note = {
      id: uuid(),
      title: input.title ?? '',
      isTitleCustom: input.isTitleCustom ?? false,
      content: input.content ?? [],
      tags: input.tags ?? [],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.add(note);
    return note;
  }

  get(id: string): Promise<Note | undefined> {
    return this.repo.get(id);
  }

  list(filter?: NoteFilter): Promise<Note[]> {
    return this.repo.list(filter);
  }

  async update(id: string, patch: Partial<Note>): Promise<void> {
    await this.repo.update(id, { ...patch, updatedAt: Date.now() });
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }

  async duplicate(id: string): Promise<Note> {
    const original = await this.repo.get(id);
    if (!original) throw new Error(`Note ${id} not found`);
    return this.create({
      title: `${original.title} (copy)`,
      isTitleCustom: true,
      content: original.content,
      tags: original.tags,
    });
  }

  archive(id: string): Promise<void> {
    return this.update(id, { isArchived: true });
  }

  restore(id: string): Promise<void> {
    return this.update(id, { isArchived: false });
  }

  async togglePin(id: string): Promise<void> {
    const note = await this.repo.get(id);
    if (!note) return;
    await this.update(id, { isPinned: !note.isPinned });
  }

  async toggleFavorite(id: string): Promise<void> {
    const note = await this.repo.get(id);
    if (!note) return;
    await this.update(id, { isFavorite: !note.isFavorite });
  }
}
