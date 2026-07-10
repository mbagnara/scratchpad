import type { HeadingItem } from '../../editor/getHeadings';

interface Props {
  headings: HeadingItem[];
}

function scrollToHeading(id: string) {
  document.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function TableOfContents({ headings }: Props) {
  if (headings.length < 2) return null;

  return (
    <nav className="toc">
      <div className="toc__label">On this page</div>
      <ul className="toc__list">
        {headings.map((h) => (
          <li key={h.id} className={`toc__item toc__item--level-${h.level}`}>
            <button onClick={() => scrollToHeading(h.id)}>{h.text}</button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
