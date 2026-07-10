import { useEffect } from 'react';
import { Sidebar } from './components/sidebar/Sidebar';
import { CommandPalette } from './components/command-palette/CommandPalette';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { EditorPane } from './editor/EditorPane';
import { useNotesStore } from './state/notesStore';
import { useUIStore } from './state/uiStore';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import './App.css';

function App() {
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const theme = useUIStore((s) => s.theme);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  useGlobalShortcuts();

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="editor-shell">
        <button
          className="mobile-menu-button"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
        <ErrorBoundary key={activeNoteId} fallbackTitle="This note couldn't be displayed.">
          <EditorPane />
        </ErrorBoundary>
      </main>
      <CommandPalette />
    </div>
  );
}

export default App;
