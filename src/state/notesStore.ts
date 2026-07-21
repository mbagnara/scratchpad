import { create } from 'zustand';
import { filterNotesForSidebar, notesService } from '../domain/notes';
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
  reorderFocus: (activeId: string, overId: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const patchNote = (notes: Note[], id: string, patch: Partial<Note>) =>
  notes.map((n) => (n.id === id ? { ...n, ...patch } : n));

const normalizeFocusOrder = (notes: Note[]) => {
  const orderedFocus = filterNotesForSidebar(notes, { type: 'focus' });
  const orderById = new Map(orderedFocus.map((note, index) => [note.id, index + 1]));
  return {
    notes: notes.map((note) => orderById.has(note.id)
      ? { ...note, focusOrder: orderById.get(note.id) }
      : note),
    orderedIds: orderedFocus.map((note) => note.id),
  };
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  activeFilter: { type: 'recent' },
  loading: false,

  loadNotes: async () => {
    set({ loading: true });
    let notes = await notesService.list();
    const focusNotes = filterNotesForSidebar(notes, { type: 'focus' });
    const needsNormalization = focusNotes.some((note, index) => note.focusOrder !== index + 1);
    if (needsNormalization) {
      const normalized = normalizeFocusOrder(notes);
      notes = normalized.notes;
      await notesService.reorderFocus(normalized.orderedIds);
    }
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
    const deleted = get().notes.find((note) => note.id === id);
    const normalized = normalizeFocusOrder(get().notes.filter((note) => note.id !== id));
    set({
      notes: normalized.notes,
      activeNoteId: get().activeNoteId === id ? null : get().activeNoteId,
    });
    await notesService.delete(id);
    if (deleted?.isPinned) await notesService.reorderFocus(normalized.orderedIds);
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
    const note = get().notes.find((item) => item.id === id);
    const normalized = normalizeFocusOrder(patchNote(get().notes, id, {
      isArchived: true,
      isPinned: false,
      focusOrder: undefined,
    }));
    set({ notes: normalized.notes });
    if (note?.isPinned) await notesService.setFocus(id, false);
    await notesService.archive(id);
    if (note?.isPinned) await notesService.reorderFocus(normalized.orderedIds);
  },

  restoreNote: async (id) => {
    set({ notes: patchNote(get().notes, id, { isArchived: false }) });
    await notesService.restore(id);
  },

  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const isFocused = !note.isPinned;
    const focusNotes = filterNotesForSidebar(get().notes, { type: 'focus' });
    const focusOrder = isFocused ? focusNotes.length + 1 : undefined;
    const normalized = normalizeFocusOrder(
      patchNote(get().notes, id, { isPinned: isFocused, focusOrder }),
    );
    set({ notes: normalized.notes });
    await notesService.setFocus(id, isFocused, focusOrder);
    await notesService.reorderFocus(normalized.orderedIds);
  },

  reorderFocus: async (activeId, overId) => {
    if (activeId === overId) return;
    const focusNotes = filterNotesForSidebar(get().notes, { type: 'focus' });
    const from = focusNotes.findIndex((note) => note.id === activeId);
    const to = focusNotes.findIndex((note) => note.id === overId);
    if (from < 0 || to < 0) return;
    const reordered = [...focusNotes];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const orderById = new Map(reordered.map((note, index) => [note.id, index + 1]));
    set({
      notes: get().notes.map((note) => orderById.has(note.id)
        ? { ...note, focusOrder: orderById.get(note.id) }
        : note),
    });
    await notesService.reorderFocus(reordered.map((note) => note.id));
  },

  toggleFavorite: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    set({ notes: patchNote(get().notes, id, { isFavorite: !note.isFavorite }) });
    await notesService.toggleFavorite(id);
  },
}));
