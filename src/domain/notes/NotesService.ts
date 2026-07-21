import { v4 as uuid } from 'uuid';
import type { NotesRepository } from './NotesRepository';
import type { Note, NoteFilter, NoteInput } from './types';

export class NotesService {
  private repo: NotesRepository;

  constructor(repo: NotesRepository) {
    this.repo = repo;
  }

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
    const focusNotes = (await this.repo.list({ pinned: true }))
      .filter((item) => !item.isArchived)
      .sort((a, b) => (a.focusOrder ?? Number.MAX_SAFE_INTEGER) - (b.focusOrder ?? Number.MAX_SAFE_INTEGER));
    if (note.isPinned) {
      await this.setFocus(id, false);
      await this.reorderFocus(focusNotes.filter((item) => item.id !== id).map((item) => item.id));
      return;
    }
    await this.setFocus(id, true, focusNotes.length + 1);
  }

  setFocus(id: string, isFocused: boolean, focusOrder?: number): Promise<void> {
    return this.repo.update(id, {
      isPinned: isFocused,
      focusOrder: isFocused ? focusOrder : undefined,
    });
  }

  reorderFocus(orderedIds: string[]): Promise<void> {
    return this.repo.updateMany(orderedIds.map((id, index) => ({
      id,
      patch: { focusOrder: index + 1 },
    })));
  }

  async toggleFavorite(id: string): Promise<void> {
    const note = await this.repo.get(id);
    if (!note) return;
    await this.update(id, { isFavorite: !note.isFavorite });
  }
}
