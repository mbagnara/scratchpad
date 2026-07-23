import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [confirmPosition, setConfirmPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!confirmPosition) return;
    const frame = requestAnimationFrame(() => cancelRef.current?.focus());

    const close = () => {
      setConfirmPosition(null);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const handlePointerDown = (event: MouseEvent) => {
      if (!confirmRef.current?.contains(event.target as Node)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !confirmRef.current) return;
      const buttons = Array.from(confirmRef.current.querySelectorAll<HTMLButtonElement>('button'));
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [confirmPosition]);

  const runAndClose = (action: () => void) => {
    action();
    setOpen(false);
  };

  const openDeleteConfirmation = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 292;
    const estimatedHeight = 174;
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    const below = rect.bottom + 8;
    const top = below + estimatedHeight <= window.innerHeight - 12
      ? below
      : Math.max(12, rect.top - estimatedHeight - 8);
    setOpen(false);
    setConfirmPosition({ top, left });
  };

  const confirmDelete = () => {
    setConfirmPosition(null);
    onDelete(note.id);
  };

  const confirmationTitleId = `delete-note-title-${note.id}`;
  const confirmationDescriptionId = `delete-note-description-${note.id}`;

  return (
    <div className={`note-actions-menu ${confirmPosition ? 'note-actions-menu--confirming' : ''}`} ref={menuRef}>
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
            {note.isPinned ? 'Remove from Focus' : 'Add to Focus'}
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
            onClick={openDeleteConfirmation}
          >
            Delete
          </button>
        </div>
      )}
      {confirmPosition && createPortal(
        <div
          ref={confirmRef}
          className="note-delete-popover"
          role="alertdialog"
          aria-labelledby={confirmationTitleId}
          aria-describedby={confirmationDescriptionId}
          style={{ top: confirmPosition.top, left: confirmPosition.left }}
        >
          <div className="note-delete-popover__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
              <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="note-delete-popover__content">
            <strong id={confirmationTitleId}>Delete “{note.title || 'Untitled note'}”?</strong>
            <p id={confirmationDescriptionId}>
              This permanently deletes the note{note.plan ? ', its Plan' : ''}, and any attachments. This can’t be undone.
            </p>
          </div>
          <div className="note-delete-popover__actions">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => {
                setConfirmPosition(null);
                requestAnimationFrame(() => triggerRef.current?.focus());
              }}
            >
              Cancel
            </button>
            <button type="button" className="note-delete-popover__confirm" onClick={confirmDelete}>
              Delete note
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
