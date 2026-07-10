import type { Note, NoteFilter } from './types';

export interface NotesRepository {
  add(note: Note): Promise<void>;
  get(id: string): Promise<Note | undefined>;
  list(filter?: NoteFilter): Promise<Note[]>;
  update(id: string, patch: Partial<Note>): Promise<void>;
  delete(id: string): Promise<void>;
}
