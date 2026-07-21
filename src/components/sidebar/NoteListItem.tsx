import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Note } from '../../domain/notes';
import { NoteActionsMenu } from './NoteActionsMenu';

interface Props {
  note: Note;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  focusPosition?: number;
  focusTotal?: number;
}

function NoteListItemImpl({
  note,
  active,
  onSelect,
  onDelete,
  onDuplicate,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onRestore,
  focusPosition,
  focusTotal,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id, disabled: focusPosition === undefined });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`note-list-item ${active ? 'note-list-item--active' : ''} ${isDragging ? 'note-list-item--dragging' : ''}`}
    >
      {focusPosition !== undefined && (
        <div className="note-list-item__priority">
          <span aria-label={`Priority ${focusPosition} of ${focusTotal}`}>{focusPosition}</span>
          <button
            className="note-list-item__drag-handle"
            type="button"
            aria-label={`Reorder ${note.title || 'Untitled'}, priority ${focusPosition} of ${focusTotal}`}
            {...attributes}
            {...listeners}
          >
            <span aria-hidden="true">⠿</span>
          </button>
        </div>
      )}
      <button className="note-list-item__button" onClick={() => onSelect(note.id)}>
        <span className="note-list-item__title">
          {note.isPinned && focusPosition === undefined && (
            <span className="note-list-item__badge" title="In Focus">◎</span>
          )}
          {note.isFavorite && <span className="note-list-item__badge">⭐</span>}
          {note.title || 'Untitled'}
        </span>
        <span className="note-list-item__meta">
          {new Date(note.updatedAt).toLocaleDateString()}
        </span>
      </button>
      <NoteActionsMenu
        note={note}
        onDuplicate={onDuplicate}
        onTogglePin={onTogglePin}
        onToggleFavorite={onToggleFavorite}
        onArchive={onArchive}
        onRestore={onRestore}
        onDelete={onDelete}
      />
    </li>
  );
}

export const NoteListItem = memo(NoteListItemImpl);
