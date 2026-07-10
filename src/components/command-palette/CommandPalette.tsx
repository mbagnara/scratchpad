import { useEffect, useRef, useState } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { useNotesStore } from '../../state/notesStore';
import { useUIStore } from '../../state/uiStore';

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const selectNote = useNotesStore((s) => s.selectNote);
  const createNote = useNotesStore((s) => s.createNote);

  const { term, setTerm, results } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      setTerm('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      previouslyFocused.current?.focus();
    }
  }, [open, setTerm]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  if (!open) return null;

  const openResult = (noteId: string) => {
    selectNote(noteId);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) openResult(results[selectedIndex].noteId);
    }
  };

  return (
    <div className="command-palette-overlay" onClick={() => setOpen(false)}>
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="command-palette__input"
          value={term}
          placeholder="Search notes…"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="command-palette-results"
          aria-activedescendant={results[selectedIndex] ? `command-palette-result-${selectedIndex}` : undefined}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <ul className="command-palette__results" id="command-palette-results" role="listbox">
          {term.trim() === '' && (
            <li className="command-palette__hint">Type to search titles, tags, and content</li>
          )}
          {term.trim() !== '' && results.length === 0 && (
            <li className="command-palette__hint">No results</li>
          )}
          {results.map((result, i) => (
            <li key={result.noteId} role="presentation">
              <button
                id={`command-palette-result-${i}`}
                role="option"
                aria-selected={i === selectedIndex}
                className={`command-palette__result ${i === selectedIndex ? 'command-palette__result--selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => openResult(result.noteId)}
              >
                {result.title || 'Untitled'}
              </button>
            </li>
          ))}
        </ul>
        <div className="command-palette__footer">
          <button
            className="command-palette__new-note"
            onClick={async () => {
              await createNote();
              setOpen(false);
            }}
          >
            + New note
          </button>
        </div>
      </div>
    </div>
  );
}
