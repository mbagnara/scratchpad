import MiniSearch from 'minisearch';
import { extractPlainText } from '../../editor/extractPlainText';
import type { Note } from '../notes/types';

interface SearchDoc {
  id: string;
  title: string;
  tags: string;
  content: string;
}

export interface SearchResult {
  noteId: string;
  title: string;
  score: number;
}

export class SearchService {
  private miniSearch = new MiniSearch<SearchDoc>({
    idField: 'id',
    fields: ['title', 'tags', 'content'],
    storeFields: ['title'],
    searchOptions: {
      boost: { title: 3, tags: 2 },
      prefix: true,
      fuzzy: 0.2,
    },
  });

  private indexed = new Set<string>();

  private toDoc(note: Note): SearchDoc {
    return {
      id: note.id,
      title: note.title,
      tags: note.tags.join(' '),
      content: extractPlainText(note.content),
    };
  }

  indexAll(notes: Note[]) {
    this.miniSearch.removeAll();
    this.indexed.clear();
    this.miniSearch.addAll(notes.map((n) => this.toDoc(n)));
    for (const n of notes) this.indexed.add(n.id);
  }

  index(note: Note) {
    const doc = this.toDoc(note);
    if (this.indexed.has(note.id)) {
      this.miniSearch.replace(doc);
    } else {
      this.miniSearch.add(doc);
      this.indexed.add(note.id);
    }
  }

  remove(noteId: string) {
    if (!this.indexed.has(noteId)) return;
    this.miniSearch.discard(noteId);
    this.indexed.delete(noteId);
  }

  query(term: string): SearchResult[] {
    if (!term.trim()) return [];
    return this.miniSearch.search(term).map((r) => ({
      noteId: String(r.id),
      title: r.title as string,
      score: r.score,
    }));
  }
}

export const searchService = new SearchService();
