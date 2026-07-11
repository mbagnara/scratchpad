import { useState } from 'react';

interface Props {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TagInput({ tags, onAddTag, onRemoveTag }: Props) {
  const [draft, setDraft] = useState('');

  const commitDraft = () => {
    const value = draft.trim().toLowerCase();
    setDraft('');
    if (!value) return;
    onAddTag(value);
  };

  return (
    <div className="tag-input">
      {tags.map((tag) => (
        <span key={tag} className="tag-input__chip">
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onRemoveTag(tag)}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="tag-input__field"
        value={draft}
        placeholder={tags.length === 0 ? '+ Add a tag' : '+ Add'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commitDraft();
          } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
            onRemoveTag(tags[tags.length - 1]);
          }
        }}
        onBlur={commitDraft}
      />
    </div>
  );
}
