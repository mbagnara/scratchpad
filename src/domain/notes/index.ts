import { DexieNotesRepository } from '../../storage/NotesRepository';
import { NotesService } from './NotesService';

export const notesService = new NotesService(new DexieNotesRepository());

export * from './types';
export * from './NotesService';
export * from './filterNotes';
