interface Props {
  label: string;
  icon: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

export function NavItem({ label, icon, count, active, onClick }: Props) {
  return (
    <button
      className={`nav-item ${active ? 'nav-item--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="nav-item__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="nav-item__label">{label}</span>
      {count !== undefined && count > 0 && <span className="nav-item__count">{count}</span>}
    </button>
  );
}
