import {
  LayoutDashboard,
  Factory,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Truck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { can, type Permission } from "../auth/permissions";

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const destinations = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, permission: "view-dashboard" },
  { label: "Pedidos", to: "/pedidos", icon: ShoppingCart, permission: "view-orders" },
  { label: "Clientes", to: "/clientes", icon: UsersRound, permission: "view-parties" },
  { label: "Fornecedores", to: "/fornecedores", icon: Factory, permission: "view-parties" },
  { label: "Logística", to: "/logistics", icon: Truck, permission: "view-logistics" },
  { label: "Financeiro", to: "/finance", icon: WalletCards, permission: "view-finance" },
] satisfies { label: string; to: string; icon: typeof LayoutDashboard; permission: Permission }[];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const { user } = useAuth();
  const visibleDestinations = user
    ? destinations.filter(({ permission }) => can(user.role, permission))
    : [];

  return (
    <nav
      aria-label="Principal"
      className="sidebar"
      data-collapsed={collapsed}
    >
      <div className="sidebar__header">
        <NavLink className="sidebar__brand" to="/dashboard" aria-label="Ogura Rep">
          <span className="sidebar__brand-mark" aria-hidden="true">
            O
          </span>
          <span className="sidebar__brand-label">Ogura Rep</span>
        </NavLink>
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
        {visibleDestinations.map(({ label, to, icon: Icon }) => (
          <NavLink
            className={({ isActive }) =>
              `sidebar__link${isActive ? " sidebar__link--active" : ""}`
            }
            key={to}
            title={collapsed ? label : undefined}
            to={to}
          >
            <Icon aria-hidden="true" size={21} />
            <span className="sidebar__link-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
