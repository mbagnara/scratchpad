interface Props {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

export function NavItem({ label, icon, active, onClick }: Props) {
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
    </button>
  );
}
