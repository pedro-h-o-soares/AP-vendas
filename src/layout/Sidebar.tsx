import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Truck,
  WalletCards,
} from "lucide-react";

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const destinations = [
  { label: "Dashboard", href: "#dashboard", icon: LayoutDashboard },
  { label: "Pedidos", href: "#pedidos", icon: ShoppingCart },
  { label: "Logística", href: "#logistica", icon: Truck },
  { label: "Financeiro", href: "#financeiro", icon: WalletCards },
] as const;

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <nav
      aria-label="Principal"
      className="sidebar"
      data-collapsed={collapsed}
    >
      <div className="sidebar__header">
        <a className="sidebar__brand" href="#dashboard" aria-label="Ogura Rep">
          <span className="sidebar__brand-mark" aria-hidden="true">
            O
          </span>
          <span className="sidebar__brand-label">Ogura Rep</span>
        </a>
        <button
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="sidebar__toggle"
          onClick={onToggle}
          type="button"
        >
          <ToggleIcon aria-hidden="true" size={20} />
        </button>
      </div>

      <div className="sidebar__links">
        {destinations.map(({ label, href, icon: Icon }, index) => (
          <a
            aria-current={index === 0 ? "page" : undefined}
            className={`sidebar__link${index === 0 ? " sidebar__link--active" : ""}`}
            href={href}
            key={href}
            title={collapsed ? label : undefined}
          >
            <Icon aria-hidden="true" size={21} />
            <span className="sidebar__link-label">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
