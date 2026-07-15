import { memo } from 'react';
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
}: Props) {
  return (
    <li className={`note-list-item ${active ? 'note-list-item--active' : ''}`}>
      <button className="note-list-item__button" onClick={() => onSelect(note.id)}>
        <span className="note-list-item__title">
          {note.isPinned && <span className="note-list-item__badge" title="In Focus">◎</span>}
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
