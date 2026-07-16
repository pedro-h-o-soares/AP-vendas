import {
  LayoutDashboard,
  MoreHorizontal,
  ShoppingCart,
  Truck,
  WalletCards,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { can, type Permission } from "../auth/permissions";

const primaryDestinations = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, permission: "view-dashboard" },
  { label: "Pedidos", to: "/pedidos", icon: ShoppingCart, permission: "view-orders" },
  { label: "Logística", to: "/logistica", icon: Truck, permission: "view-logistics" },
  { label: "Financeiro", to: "/financeiro", icon: WalletCards, permission: "view-finance" },
] satisfies { label: string; to: string; icon: typeof LayoutDashboard; permission: Permission }[];

const overflowDestinations = [
  { label: "Clientes", to: "/clientes", permission: "view-parties" },
  { label: "Fornecedores", to: "/fornecedores", permission: "view-parties" },
  { label: "Ocorrências", to: "/ocorrencias", permission: "view-logistics" },
  { label: "Cheques", to: "/checks", permission: "view-checks" },
  { label: "Acertos", to: "/settlements", permission: "view-settlements" },
  { label: "Relatórios", to: "/reports", permission: "view-reports" },
  { label: "Usuários", to: "/users", permission: "manage-users" },
] satisfies { label: string; to: string; permission: Permission }[];

export function MobileNav() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const navRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);
  const visibleDestinations = user
    ? primaryDestinations.filter(({ permission }) => can(user.role, permission))
    : [];
  const visibleOverflow = user
    ? overflowDestinations.filter(({ permission }) => can(user.role, permission))
    : [];

  useEffect(() => {
    if (!menuOpen) return;
    firstMenuItemRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      moreRef.current?.focus();
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [menuOpen]);

  return (
    <nav ref={navRef} aria-label="Navegação móvel" className="mobile-nav">
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
      {visibleOverflow.length > 0 && (
        <>
          <button
            ref={moreRef}
            aria-controls={menuId}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="mobile-nav__link mobile-nav__more-button"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <MoreHorizontal aria-hidden="true" size={20} />
            <span>Mais</span>
          </button>
          {menuOpen && (
            <div aria-label="Mais destinos" className="mobile-nav__popover" id={menuId} role="menu">
              {visibleOverflow.map(({ label, to }, index) => (
                <NavLink
                  ref={index === 0 ? firstMenuItemRef : undefined}
                  className={({ isActive }) => `mobile-nav__popover-link${isActive ? " mobile-nav__popover-link--active" : ""}`}
                  key={to}
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                  to={to}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </>
      )}
    </nav>
  );
}
