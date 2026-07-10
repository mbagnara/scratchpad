import { useEffect, useRef, useState } from 'react';
import type { Note } from '../../domain/notes';

interface Props {
  note: Note;
  onDuplicate: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NoteActionsMenu({
  note,
  onDuplicate,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onRestore,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const runAndClose = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <div className="note-actions-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        className="note-actions-menu__trigger"
        aria-label="Note actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⋮
      </button>
      {open && (
        <div className="note-actions-menu__dropdown" role="menu">
          <button role="menuitem" onClick={() => runAndClose(() => onToggleFavorite(note.id))}>
            {note.isFavorite ? 'Unfavorite' : 'Favorite'}
          </button>
          <button role="menuitem" onClick={() => runAndClose(() => onTogglePin(note.id))}>
            {note.isPinned ? 'Unpin' : 'Pin'}
          </button>
          <button role="menuitem" onClick={() => runAndClose(() => onDuplicate(note.id))}>
            Duplicate
          </button>
          {note.isArchived ? (
            <button role="menuitem" onClick={() => runAndClose(() => onRestore(note.id))}>
              Restore
            </button>
          ) : (
            <button role="menuitem" onClick={() => runAndClose(() => onArchive(note.id))}>
              Archive
            </button>
          )}
          <button
            role="menuitem"
            className="note-actions-menu__danger"
            onClick={() => runAndClose(() => onDelete(note.id))}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
