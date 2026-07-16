import {
  LayoutDashboard,
  MoreHorizontal,
  ShoppingCart,
  Truck,
  WalletCards,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { can, type Permission } from "../auth/permissions";

const destinations = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, permission: "view-dashboard" },
  { label: "Pedidos", to: "/pedidos", icon: ShoppingCart, permission: "view-orders" },
  { label: "Logística", to: "/logistics", icon: Truck, permission: "view-logistics" },
  { label: "Financeiro", to: "/finance", icon: WalletCards, permission: "view-finance" },
  { label: "Mais", to: "/reports", icon: MoreHorizontal, permission: "view-reports" },
] satisfies { label: string; to: string; icon: typeof LayoutDashboard; permission: Permission }[];

export function MobileNav() {
  const { user } = useAuth();
  const visibleDestinations = user
    ? destinations.filter(({ permission }) => can(user.role, permission))
    : [];

  return (
    <nav aria-label="Navegação móvel" className="mobile-nav">
      {visibleDestinations.map(({ label, to, icon: Icon }) => (
        <NavLink
          className={({ isActive }) =>
            `mobile-nav__link${isActive ? " mobile-nav__link--active" : ""}`
          }
          key={to}
          to={to}
        >
          <Icon aria-hidden="true" size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
