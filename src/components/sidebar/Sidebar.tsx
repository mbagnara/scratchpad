import { getAvailableTags, filterNotesForSidebar } from '../../domain/notes';
import { useNotesStore } from '../../state/notesStore';
import { useUIStore } from '../../state/uiStore';
import { NavItem } from './NavItem';
import { NoteListItem } from './NoteListItem';

export function Sidebar() {
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
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const visibleNotes = filterNotesForSidebar(notes, activeFilter);
  const tags = getAvailableTags(notes);

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
            label="Recent"
            icon="🕐"
            active={activeFilter.type === 'recent'}
            onClick={() => setFilter({ type: 'recent' })}
          />
          <NavItem
            label="Favorites"
            icon="⭐"
            active={activeFilter.type === 'favorites'}
            onClick={() => setFilter({ type: 'favorites' })}
          />
          <NavItem
            label="Pinned"
            icon="📌"
            active={activeFilter.type === 'pinned'}
            onClick={() => setFilter({ type: 'pinned' })}
          />
          <NavItem
            label="Archive"
            icon="🗄"
            active={activeFilter.type === 'archive'}
            onClick={() => setFilter({ type: 'archive' })}
          />
        </nav>

        {tags.length > 0 && (
          <>
            <div className="sidebar__section-label">Tags</div>
            <nav className="sidebar__nav">
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
          </>
        )}

        {activeFilter.type === 'tag' && (
          <div className="sidebar__section-label">#{activeFilter.tag}</div>
        )}
        <ul className="note-list">
          {visibleNotes.map((note) => (
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
            />
          ))}
          {visibleNotes.length === 0 && <li className="note-list__empty">No notes here</li>}
        </ul>

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
