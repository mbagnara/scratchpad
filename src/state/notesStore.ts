import { create } from 'zustand';
import { notesService } from '../domain/notes';
import type { Note, SidebarFilter } from '../domain/notes';
import { searchService } from '../domain/search/SearchService';
import { attachmentsService } from '../domain/attachments';

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  activeFilter: SidebarFilter;
  loading: boolean;
  loadNotes: () => Promise<void>;
  setFilter: (filter: SidebarFilter) => void;
  selectNote: (id: string | null) => void;
  createNote: () => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const patchNote = (notes: Note[], id: string, patch: Partial<Note>) =>
  notes.map((n) => (n.id === id ? { ...n, ...patch } : n));

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  activeFilter: { type: 'recent' },
  loading: false,

  loadNotes: async () => {
    set({ loading: true });
    const notes = await notesService.list();
    set({ notes, loading: false });
    searchService.indexAll(notes);
  },

  setFilter: (filter) => set({ activeFilter: filter }),

  selectNote: (id) => set({ activeNoteId: id }),

  createNote: async () => {
    const note = await notesService.create();
    set({ notes: [note, ...get().notes], activeNoteId: note.id });
    searchService.index(note);
    return note;
  },

  updateNote: async (id, patch) => {
    set({ notes: patchNote(get().notes, id, { ...patch, updatedAt: Date.now() }) });
    await notesService.update(id, patch);
    const updated = get().notes.find((n) => n.id === id);
    if (updated) searchService.index(updated);
  },

  deleteNote: async (id) => {
    set({
      notes: get().notes.filter((n) => n.id !== id),
      activeNoteId: get().activeNoteId === id ? null : get().activeNoteId,
    });
    await notesService.delete(id);
    await attachmentsService.deleteNoteAttachments(id);
    searchService.remove(id);
  },

  duplicateNote: async (id) => {
    const copy = await notesService.duplicate(id);
    await attachmentsService.copyNoteAttachments(id, copy.id);
    set({ notes: [copy, ...get().notes] });
    searchService.index(copy);
  },

  archiveNote: async (id) => {
    set({ notes: patchNote(get().notes, id, { isArchived: true }) });
    await notesService.archive(id);
  },

  restoreNote: async (id) => {
    set({ notes: patchNote(get().notes, id, { isArchived: false }) });
    await notesService.restore(id);
  },

  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    set({ notes: patchNote(get().notes, id, { isPinned: !note.isPinned }) });
    await notesService.togglePin(id);
  },

  toggleFavorite: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    set({ notes: patchNote(get().notes, id, { isFavorite: !note.isFavorite }) });
    await notesService.toggleFavorite(id);
  },
}));
