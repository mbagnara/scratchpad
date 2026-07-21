# Notebook — Architecture & Design Document

A minimal, fast, distraction-free note-taking app. Client-only SPA (React + Vite), local-first storage (IndexedDB), no backend in v1. Architecture is layered so a sync backend can be added later without touching UI or editor code.

**Stack:** React + Vite + TypeScript · BlockNote (Tiptap/ProseMirror) editor · Dexie.js (IndexedDB) · Zustand · MiniSearch

---

## 1. Product Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          UI Layer                            │
│   Pages · Layout · Sidebar · Editor Shell · Command Palette   │
└───────────────────────────┬───────────────────────────────────┘
                            │ hooks (useNotes, useSearch, useNote)
┌───────────────────────────▼───────────────────────────────────┐
│                       State Layer (Zustand)                   │
│   notesStore · uiStore · editorStore                          │
└───────────────────────────┬───────────────────────────────────┘
                            │ calls
┌───────────────────────────▼───────────────────────────────────┐
│                    Domain / Service Layer                     │
│   NotesService · SearchService · AutosaveService              │
│   (pure business logic, no React, no storage details leaked)  │
└──────────────┬───────────────────────────────┬─────────────────┘
               │                               │
┌──────────────▼───────────────┐   ┌───────────▼─────────────────┐
│      Storage Layer            │   │      Search Layer            │
│  Dexie/IndexedDB repository    │   │  MiniSearch in-memory index  │
└────────────────────────────────┘   └───────────────────────────────┘
```

Key principle: **UI never talks to storage directly.** Everything flows through services. This is the seam that lets a future backend (REST/GraphQL + sync) replace the storage layer transparently — the service interfaces don't change, only their implementation.

---

## 2. UI Wireframes

**Main layout (desktop):**

```
┌──────────┬──────────────────────────────────────────┬───────────┐
│ Sidebar  │              Editor                       │   TOC     │
│          │  Title___________________________         │ (only if  │
│ ⌘K Search│  ─────────────────────────────────         │ ≥2        │
│          │                                            │ headings) │
│ ★ Favs   │  [¶] Paragraph text...                     │ • Intro   │
│ ◎ Focus  │  [H1] Heading                              │ • Setup   │
│ 🕐 Recent│  [☐] Checklist item                        │ • Notes   │
│ 🏷 Tags  │  [❝] Quote block                           │           │
│          │  ```code```                                │           │
│ + New    │                                            │           │
│ Archive  │  Saving… / Saved ✓ / Offline               │           │
└──────────┴──────────────────────────────────────────┴───────────┘
```

**Slash command menu (inline popover at cursor):**

```
/cod█
┌────────────────────────────┐
│ 🔤 Code Block          ↵   │
│ 📋 Callout                 │
│ 🔗 (fuzzy matched, ↑↓ nav) │
└────────────────────────────┘
```

**Mobile:** Sidebar collapses to a slide-over drawer triggered by a hamburger icon; TOC collapses into a floating "jump to section" button; editor becomes full-width.

---

## 3. Component Hierarchy

```
App
├── AppShell
│   ├── Sidebar
│   │   ├── SearchTrigger (opens CommandPalette)
│   │   ├── NavSection (Focus / Favorites / Recent / Tags / Archive)
│   │   └── NoteListItem
│   ├── EditorPane
│   │   ├── NoteHeader (title, tags, meta, saving-status pill)
│   │   ├── BlockEditor (BlockNote wrapper)
│   │   │   ├── SlashMenu
│   │   │   ├── BlockToolbar (per-block: drag handle, +, ⋮ menu)
│   │   │   └── CustomBlocks: Toggle, Callout, Divider, FileAttachment
│   │   └── TableOfContents (conditional)
│   └── CommandPalette (⌘K — search + quick actions)
└── Providers (ThemeProvider, StoreProvider)
```

Design rules: presentational components (`Sidebar`, `NoteListItem`, `TableOfContents`) receive data via props/hooks only; no component imports Dexie or MiniSearch directly — everything goes through `hooks/`.

---

## 4. Folder Structure

```
src/
├── app/                     # App shell, routing, providers
│   ├── App.tsx
│   └── providers/
├── components/              # Reusable, presentational UI
│   ├── sidebar/
│   ├── command-palette/
│   ├── toc/
│   └── ui/                  # Buttons, inputs, pills — design system primitives
├── editor/                  # Everything editor-specific
│   ├── BlockEditor.tsx
│   ├── blocks/              # Custom block definitions (Toggle, Callout, Divider, File)
│   ├── slash-menu/
│   ├── markdown-shortcuts/
│   └── schema.ts            # BlockNote schema (block type registry)
├── domain/                  # Business logic, framework-agnostic
│   ├── notes/
│   │   ├── NotesService.ts
│   │   └── types.ts
│   ├── search/
│   │   └── SearchService.ts
│   └── autosave/
│       └── AutosaveService.ts
├── storage/                 # Persistence, swappable
│   ├── db.ts                # Dexie schema/instance
│   └── NotesRepository.ts   # implements domain repository interface
├── state/                   # Zustand stores (thin, delegate to domain/)
│   ├── notesStore.ts
│   ├── uiStore.ts
│   └── editorStore.ts
├── hooks/                   # useNotes, useNote, useSearch, useAutosave, useKeyboardShortcuts
├── pages/                   # Route-level views
└── styles/
```

---

## 5. Data Schema (IndexedDB via Dexie)

```ts
interface Note {
  id: string;              // uuid
  title: string;
  content: Block[];        // BlockNote document (JSON tree)
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  focusOrder?: number;     // one-based priority inside Focus
  isArchived: boolean;
  createdAt: number;       // epoch ms
  updatedAt: number;
  lastOpenedAt: number | null;
}

interface Block {          // shape owned by the editor, persisted as-is
  id: string;
  type: 'paragraph' | 'heading' | 'bulletList' | 'numberedList' | 'checklist'
      | 'quote' | 'divider' | 'toggle' | 'callout' | 'code' | 'image' | 'file';
  props: Record<string, unknown>;   // e.g. { level: 1 } for headings, { checked } for checklist
  content: InlineContent[];
  children: Block[];       // nesting for toggles, nested lists
}

interface Attachment {
  id: string;
  noteId: string;
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: number;
}
```

```ts
// storage/db.ts
class NotebookDB extends Dexie {
  notes!: Table<Note, string>;
  attachments!: Table<Attachment, string>;

  constructor() {
    super('notebook-db');
    this.version(1).stores({
      notes: 'id, title, updatedAt, isArchived, isFavorite, isPinned, *tags',
      attachments: 'id, noteId',
    });
  }
}
```

Notes:
- `content` stored as the editor's native JSON — no lossy translation layer between editor and storage.
- `*tags` is a Dexie multi-entry index, enabling fast "notes by tag" queries without a full scan.
- Attachments stored as `Blob` in IndexedDB (not base64 in the note document) to keep note records small and fast to load.

---

## 6. API Design (Service Layer)

No network API in v1 — the "API" is the internal service contract. This boundary is what a future REST/GraphQL backend would implement identically, so callers (hooks/stores) never need to change.

```ts
// domain/notes/NotesService.ts
interface NotesService {
  create(partial?: Partial<Note>): Promise<Note>;
  get(id: string): Promise<Note | undefined>;
  list(filter?: NoteFilter): Promise<Note[]>;   // e.g. { archived: false, tag: 'work' }
  update(id: string, patch: Partial<Note>): Promise<void>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<Note>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  togglePin(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
}

// domain/search/SearchService.ts
interface SearchService {
  index(note: Note): void;
  remove(noteId: string): void;
  query(term: string): SearchResult[];   // { noteId, title, snippet, score }
}
```

This mirrors what a REST API would look like (`POST /notes`, `GET /notes/:id`, `PATCH /notes/:id`, etc.) intentionally — porting to a real backend later is a matter of swapping the implementation behind these same method signatures.

---

## 7. State Management

**Zustand**, chosen over Redux/Context for minimal boilerplate and because there's no need for time-travel debugging or middleware complexity at this scale.

- `notesStore` — list of notes, current filter (favorites/pinned/archive/tag), CRUD actions that delegate to `NotesService`. Optimistic updates (UI reflects change instantly, persisted async).
- `editorStore` — active note id, dirty/save status (`idle | saving | saved | offline`), toggle-expand state map (persisted per note so it survives reloads).
- `uiStore` — sidebar collapsed state, theme (light/dark), command palette open/closed.

Rule: stores never import Dexie directly — only `domain/` services. This keeps stores swappable and business logic testable without React.

Autosave: `useAutosave` hook debounces editor `onChange` (≈400ms), calls `NotesService.update`, and reflects `saving → saved` in `editorStore`. Browser `online`/`offline` events flip status to `offline` and queue nothing further (IndexedDB is always local, so "offline" here really means "sync would be paused" once a backend exists).

---

## 8. Editor Architecture

**BlockNote** (built on Tiptap/ProseMirror) as the base — it already provides the block model, drag-and-drop reordering, slash menu, markdown shortcuts, and block-to-block conversion described in the requirements, which would take weeks to build reliably from scratch (cursor handling, undo/redo, IME support, etc. are notoriously hard to get right by hand).

- **Built-in from BlockNote:** paragraph, headings (H1–H3), bullet/numbered lists, checklist, quote, divider, code block (with language selection), image, file attachment, drag handles, slash menu, markdown-shortcut input rules, block conversion menu.
- **Custom block extensions** (`editor/blocks/`): `Toggle` (collapsible, persists expand state in block props) and `Callout` (variant prop: idea/important/warning/reference/success, rendered via the design system's `Callout` UI primitive).
- **Code syntax highlighting:** `lowlight`/`highlight.js` restricted to the six required languages (Python, SQL, JSON, YAML, Bash, JavaScript) to keep bundle size down; each code block gets a copy-to-clipboard button.
- **Slash menu & markdown shortcuts:** configured via BlockNote's schema — extend the default item list with entries for the custom blocks, filtered/fuzzy-matched as the user types.
- **Table of Contents:** derived by walking the block tree for heading blocks on every content change (cheap — just a filter/map), not a separate stored structure. Rendered only when ≥2 headings exist.

This isolates all ProseMirror/BlockNote-specific code inside `editor/`, so the rest of the app only ever sees the `Block[]` document shape — a future migration to a different editor engine would touch this folder only.

---

## 9. Search Architecture

**MiniSearch** — a lightweight, dependency-free full-text search library that runs entirely in-memory client-side, ideal for the expected scale (hundreds to low-thousands of local notes).

- Index fields: `title` (boosted), `tags` (boosted), and a flattened plain-text extraction of `content` (block tree → string, computed on save).
- Index built once on app load (from all notes in Dexie) and kept incrementally in sync: `NotesService.create/update/delete` calls `SearchService.index/remove` as a side effect.
- Query-as-you-type: `useSearch` hook debounces ~150ms, calls `SearchService.query`, returns ranked results with highlighted snippets.
- Because everything is in-memory, results are effectively instant; no server round-trip exists to introduce latency.

Trade-off note: an alternative would be relying on Dexie's own indexed queries for search, but Dexie only supports exact/prefix/range matching on indexed fields — it can't do fuzzy, ranked, multi-field full-text search. MiniSearch is the simplest addition that gets real full-text search without standing up a server-side search engine (which would be over-engineering for a local-first app).

---

## 10. Incremental Implementation Plan

**M1 — Foundation**
Vite + TS scaffold, folder structure, Dexie schema, `NotesService` + `NotesRepository`, basic Zustand `notesStore`. Sidebar note list (create/delete only), no editor yet — just a plain textarea bound to `content`.

**M2 — Block Editor Core**
Integrate BlockNote, wire to `content` field, implement autosave (debounced save + status pill). Support core blocks: paragraph, headings, bullet/numbered list, quote, divider.

**M3 — Advanced Blocks**
Checklist (nested, reorderable), code block with syntax highlighting + copy button, image and file attachment blocks (Dexie `attachments` table), drag-and-drop file upload into editor.

**M4 — Custom Blocks & Slash Menu**
Toggle (collapsible, persisted state) and Callout (5 variants) as custom BlockNote extensions; extend slash menu with all block types; verify markdown-shortcut auto-conversion end-to-end.

**M5 — Organization**
Tags, Favorites, Pinned, Archive/Restore, Duplicate note, Recent Notes list, sidebar filtering/sections.

**M6 — Search & Navigation**
MiniSearch integration, `⌘K` command palette (search + quick actions), Table of Contents with scroll-to-section.

**M7 — Keyboard-First & Polish**
Full keyboard shortcut map (bold, code block, commands, search, block navigation), accessibility pass (focus management, ARIA on menus/toggles), dark mode, responsive/mobile layout.

**M8 — Hardening**
Empty states, error boundaries around editor/storage, performance pass on large notes/many notes, offline-status handling, final visual polish.

Each milestone ends with a usable, demoable app — no milestone leaves the app in a broken intermediate state.

---

## Architecture's Answer to Future Expansion

- **Nested pages / linked notes / backlinks:** `Note` gains `parentId` / a `links: string[]` field; `NotesService` gains graph-traversal methods. UI layer unaffected.
- **Templates:** a `Template` type reusing the same `Block[]` shape; "new from template" just seeds `NotesService.create`.
- **Version history:** an append-only `NoteVersion` table keyed by `noteId`, written by `AutosaveService` on a coarser interval — storage-layer-only change.
- **Real-time collaboration / sync:** replace `NotesRepository`'s Dexie implementation with one backed by a network API + CRDT/OT layer, behind the same `NotesService` interface. UI, editor, and search layers require zero changes.
- **AI-assisted writing:** a new `AIService` consumed by an editor toolbar action; slots into `editor/` without touching storage or state.
- **Databases / Calendar view:** new `pages/` + read-side projections over the existing `Note` collection (e.g., notes-with-due-date-tag rendered on a calendar), no schema migration required for a first pass.

The Notes-Service / Storage-Layer seam is the load-bearing boundary — every future feature above extends one side of it without requiring changes on the other.
