import { useEffect, useReducer, useRef } from 'react';
import type { Block } from '@blocknote/core';
import { useNotesStore } from '../state/notesStore';
import { useEditorStore } from '../state/editorStore';
import { useAutosave } from '../hooks/useAutosave';
import { TagInput } from '../components/ui/TagInput';
import { TableOfContents } from '../components/toc/TableOfContents';
import { BlockEditor, type BlockEditorHandle } from './BlockEditor';
import { deriveTitleFromContent } from './deriveTitle';
import { getHeadings } from './getHeadings';

const STATUS_LABEL: Record<string, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  offline: 'Offline',
  error: "Couldn't save",
};

interface PendingPatch {
  title: string;
  isTitleCustom: boolean;
  content: Block[];
  tags: string[];
}

export function EditorPane() {
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const note = useNotesStore((s) => s.notes.find((n) => n.id === activeNoteId));
  const updateNote = useNotesStore((s) => s.updateNote);
  const togglePin = useNotesStore((s) => s.togglePin);
  const toggleFavorite = useNotesStore((s) => s.toggleFavorite);
  const saveStatus = useEditorStore((s) => s.saveStatus);

  const pendingPatch = useRef<PendingPatch | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const blockEditorRef = useRef<BlockEditorHandle>(null);
  // pendingPatch is a ref (so handlers always read/write the latest value,
  // never a stale render snapshot); bump this to force a re-render so the
  // UI (tag chips, title) reflects it immediately.
  const [, forceUpdate] = useReducer((c) => c + 1, 0);

  useEffect(() => {
    // Flush and detach any unsaved edits from the note we're navigating away
    // from — otherwise they'd linger in this shared ref and, once the
    // debounced save eventually fires, get written onto the *new* note.
    return () => {
      if (note && pendingPatch.current) {
        updateNote(note.id, pendingPatch.current);
      }
      pendingPatch.current = null;
    };
  }, [note?.id]);

  const scheduleSave = useAutosave(async () => {
    if (!note || !pendingPatch.current) return;
    await updateNote(note.id, pendingPatch.current);
  });

  if (!note) {
    return (
      <div className="editor-pane editor-pane--empty">
        <p>Select a note or create a new one to start writing.</p>
      </div>
    );
  }

  const getCurrent = (): PendingPatch => ({
    title: pendingPatch.current?.title ?? note.title,
    isTitleCustom: pendingPatch.current?.isTitleCustom ?? note.isTitleCustom,
    content: pendingPatch.current?.content ?? note.content,
    tags: pendingPatch.current?.tags ?? note.tags,
  });

  const commitPatch = (patch: PendingPatch) => {
    pendingPatch.current = patch;
    forceUpdate();
    scheduleSave();
  };

  const handleTitleChange = (value: string) => {
    commitPatch({ ...getCurrent(), title: value, isTitleCustom: true });
  };

  const handleContentChange = (blocks: Block[]) => {
    const current = getCurrent();
    if (current.isTitleCustom) {
      commitPatch({ ...current, content: blocks });
      return;
    }
    const derivedTitle = deriveTitleFromContent(blocks);
    if (titleInputRef.current) titleInputRef.current.value = derivedTitle;
    commitPatch({ ...current, content: blocks, title: derivedTitle });
  };

  const handleAddTag = (tag: string) => {
    const current = getCurrent();
    if (current.tags.includes(tag)) return;
    commitPatch({ ...current, tags: [...current.tags, tag] });
  };

  const handleRemoveTag = (tag: string) => {
    const current = getCurrent();
    commitPatch({ ...current, tags: current.tags.filter((t) => t !== tag) });
  };

  const current = getCurrent();

  return (
    <div className="editor-pane">
      <div className="editor-pane__eyebrow">
        <span>Notes</span>
        <span aria-hidden="true">/</span>
        <span>{note.isArchived ? 'Archive' : 'Workspace'}</span>
      </div>
      <div className="editor-pane__header">
        <input
          key={note.id}
          ref={titleInputRef}
          className="editor-pane__title"
          defaultValue={current.title}
          placeholder="Untitled"
          onChange={(e) => handleTitleChange(e.target.value)}
        />
        <div className="editor-pane__quick-actions">
          <button
            className={`editor-pane__icon-button ${note.isFavorite ? 'editor-pane__icon-button--active' : ''}`}
            aria-label={note.isFavorite ? 'Unfavorite' : 'Favorite'}
            onClick={() => toggleFavorite(note.id)}
          >
            <span aria-hidden="true">☆</span>
          </button>
          <button
            className={`editor-pane__icon-button ${note.isPinned ? 'editor-pane__icon-button--active' : ''}`}
            aria-label={note.isPinned ? 'Remove from Focus' : 'Add to Focus'}
            title={note.isPinned ? 'Remove from Focus' : 'Add to Focus'}
            onClick={() => togglePin(note.id)}
          >
            <span aria-hidden="true">◎</span>
          </button>
          <button
            className="editor-pane__icon-button"
            aria-label="Attach files"
            title="Attach files (25 MB max)"
            onClick={() => blockEditorRef.current?.openFilePicker()}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M8.5 12.5 14.8 6.2a3 3 0 0 1 4.2 4.2l-8 8a5 5 0 0 1-7.1-7.1l8.4-8.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <span className={`editor-pane__status ${saveStatus === 'error' ? 'editor-pane__status--error' : ''}`}>
            {STATUS_LABEL[saveStatus]}
          </span>
        </div>
      </div>
      <TagInput tags={current.tags} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
      <BlockEditor
        ref={blockEditorRef}
        key={note.id}
        noteId={note.id}
        initialContent={note.content}
        onChange={handleContentChange}
      />
      <TableOfContents headings={getHeadings(current.content)} />
    </div>
  );
}
