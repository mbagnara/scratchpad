# scratchpad

A fast, distraction-free note-taking app with a block-based editor, instant search, and offline-first local storage.

## Features

- Block-based editor: paragraphs, headings, bullet/numbered lists, checklists, quotes, dividers, toggles, callouts, code blocks with syntax highlighting, images, and inline file attachments
- Note-level attachments with a collapsible file panel, preview, download, rename, and removal
- Slash command menu (`/`) and markdown shortcuts (`#`, `-`, `>`, ` ``` `, ...)
- Instant full-text search across titles, tags, and content (`Cmd/Ctrl+K`)
- Tags, favorites, Focus working set, and archive
- Auto-generated title from note content (editable anytime)
- Table of contents with scroll-to-section navigation
- Autosave with live status (Saving… / Saved / Offline)
- Keyboard-first shortcuts (bold, code block, commands, search)
- Dark mode, responsive layout
- Fully offline — notes are stored locally in the browser (IndexedDB), no account or server required

## Tech stack

- [React](https://react.dev/) + TypeScript + [Vite](https://vitejs.dev/)
- [BlockNote](https://www.blocknotejs.org/) — block editor (built on ProseMirror/Tiptap)
- [Dexie](https://dexie.org/) — IndexedDB wrapper for local storage
- [Zustand](https://zustand-demo.pmnd.rs/) — state management
- [MiniSearch](https://lucaong.github.io/minisearch/) — in-memory full-text search

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design document — component hierarchy, data schema, state management, editor architecture, and the milestone-by-milestone implementation plan.
