import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { getAvailableTags, filterNotesForSidebar } from '../../domain/notes';
import { useNotesStore } from '../../state/notesStore';
import { useUIStore } from '../../state/uiStore';
import { NavItem } from './NavItem';
import { NoteListItem } from './NoteListItem';

export function Sidebar() {
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const notes = useNotesStore((s) => s.notes);
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const activeFilter = useNotesStore((s) => s.activeFilter);
  const setFilter = useNotesStore((s) => s.setFilter);
  const selectNote = useNotesStore((s) => s.selectNote);
  const createNote = useNotesStore((s) => s.createNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const duplicateNote = useNotesStore((s) => s.duplicateNote);
  const togglePin = useNotesStore((s) => s.togglePin);
  const toggleFavorite = useNotesStore((s) => s.toggleFavorite);
  const archiveNote = useNotesStore((s) => s.archiveNote);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const reorderFocus = useNotesStore((s) => s.reorderFocus);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const visibleNotes = filterNotesForSidebar(notes, activeFilter);
  const tags = getAvailableTags(notes);
  const focusCount = notes.filter((note) => !note.isArchived && note.isPinned).length;
  const recentCount = filterNotesForSidebar(notes, { type: 'recent' }).length;
  const favoritesCount = notes.filter((note) => !note.isArchived && note.isFavorite).length;
  const archiveCount = filterNotesForSidebar(notes, { type: 'archive' }).length;
  const focusActive = activeFilter.type === 'focus';
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!focusActive || !over || active.id === over.id) return;
    void reorderFocus(String(active.id), String(over.id));
  };

  const selectAndClose = (id: string) => {
    selectNote(id);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark" aria-hidden="true">N</span>
          <div>
            <strong>Noted</strong>
            <span>Personal workspace</span>
          </div>
        </div>
        <button
          className="sidebar__new-note"
          onClick={() => {
            createNote();
            setSidebarOpen(false);
          }}
        >
          <span aria-hidden="true">＋</span>
          <span>New note</span>
          <span className="sidebar__new-note-key">⌘N</span>
        </button>
        <button
          className="sidebar__search-trigger"
          onClick={() => {
            setCommandPaletteOpen(true);
            setSidebarOpen(false);
          }}
        >
          <span className="sidebar__search-label"><span aria-hidden="true">⌕</span> Search notes</span>
          <span className="sidebar__search-shortcut">⌘K</span>
        </button>

        <div className="sidebar__section-label">Workspace</div>
        <nav className="sidebar__nav">
          <NavItem
            label="Focus"
            icon="◎"
            count={focusCount}
            active={activeFilter.type === 'focus'}
            onClick={() => setFilter({ type: 'focus' })}
          />
          <NavItem
            label="Recent"
            icon="🕐"
            count={recentCount}
            active={activeFilter.type === 'recent'}
            onClick={() => setFilter({ type: 'recent' })}
          />
          <NavItem
            label="Favorites"
            icon="⭐"
            count={favoritesCount}
            active={activeFilter.type === 'favorites'}
            onClick={() => setFilter({ type: 'favorites' })}
          />
          <NavItem
            label="Archive"
            icon="🗄"
            count={archiveCount}
            active={activeFilter.type === 'archive'}
            onClick={() => setFilter({ type: 'archive' })}
          />
        </nav>

        {tags.length > 0 && (
          <section className={`sidebar__tags ${tagsExpanded ? 'sidebar__tags--expanded' : ''}`}>
            <button
              className="sidebar__tags-header"
              type="button"
              aria-expanded={tagsExpanded}
              aria-controls="sidebar-tags-list"
              onClick={() => setTagsExpanded((expanded) => !expanded)}
            >
              <span>Tags</span>
              <span className="sidebar__tags-meta">
                <span className="sidebar__tags-count">{tags.length}</span>
                <span className="sidebar__tags-chevron" aria-hidden="true">›</span>
              </span>
            </button>

            {tagsExpanded ? (
              <nav className="sidebar__tags-list" id="sidebar-tags-list" aria-label="Tags">
                {tags.map((tag) => (
                  <NavItem
                    key={tag}
                    label={tag}
                    icon="🏷"
                    active={activeFilter.type === 'tag' && activeFilter.tag === tag}
                    onClick={() => setFilter({ type: 'tag', tag })}
                  />
                ))}
              </nav>
            ) : activeFilter.type === 'tag' ? (
              <nav className="sidebar__tags-active" aria-label="Active tag">
                <NavItem
                  label={activeFilter.tag}
                  icon="🏷"
                  active
                  onClick={() => setTagsExpanded(true)}
                />
              </nav>
            ) : null}
          </section>
        )}

        <section className={`sidebar__notes ${notesExpanded ? 'sidebar__notes--expanded' : ''}`}>
          <button
            className="sidebar__notes-heading"
            type="button"
            aria-expanded={notesExpanded}
            aria-controls="sidebar-notes-list"
            onClick={() => setNotesExpanded((expanded) => !expanded)}
          >
            <span>Notes</span>
            {activeFilter.type === 'tag' && <span>#{activeFilter.tag}</span>}
            <span className="sidebar__notes-meta">
              <span className="sidebar__notes-count">{visibleNotes.length}</span>
              <span className="sidebar__notes-chevron" aria-hidden="true">›</span>
            </span>
          </button>

          {notesExpanded && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleNotes.map((note) => note.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul id="sidebar-notes-list" className={`note-list ${focusActive ? 'note-list--focus' : ''}`}>
                  {visibleNotes.map((note, index) => (
                    <NoteListItem
                      key={note.id}
                      note={note}
                      active={note.id === activeNoteId}
                      onSelect={selectAndClose}
                      onDelete={deleteNote}
                      onDuplicate={duplicateNote}
                      onTogglePin={togglePin}
                      onToggleFavorite={toggleFavorite}
                      onArchive={archiveNote}
                      onRestore={restoreNote}
                      focusPosition={focusActive ? index + 1 : undefined}
                      focusTotal={focusActive ? visibleNotes.length : undefined}
                    />
                  ))}
                  {visibleNotes.length === 0 && (
                    <li className="note-list__empty">
                      {focusActive
                        ? 'Your focus is clear. Add a note when you start working on it.'
                        : 'No notes here'}
                    </li>
                  )}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </section>

        <div className="sidebar__footer">
          <div className="sidebar__storage">
            <span className="sidebar__storage-dot" />
            <span>Stored locally</span>
          </div>
          <button
            className="sidebar__theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </aside>
    </>
  );
}
