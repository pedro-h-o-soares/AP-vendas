import {
  LayoutDashboard,
  MoreHorizontal,
  ShoppingCart,
  Truck,
  WalletCards,
} from "lucide-react";

const destinations = [
  { label: "Dashboard", href: "#dashboard", icon: LayoutDashboard },
  { label: "Pedidos", href: "#pedidos", icon: ShoppingCart },
  { label: "Logística", href: "#logistica", icon: Truck },
  { label: "Financeiro", href: "#financeiro", icon: WalletCards },
  { label: "Mais", href: "#mais", icon: MoreHorizontal },
] as const;

export function MobileNav() {
  return (
    <nav aria-label="Navegação móvel" className="mobile-nav">
      {destinations.map(({ label, href, icon: Icon }, index) => (
        <a
          aria-current={index === 0 ? "page" : undefined}
          className={`mobile-nav__link${index === 0 ? " mobile-nav__link--active" : ""}`}
          href={href}
          key={href}
        >
          <Icon aria-hidden="true" size={20} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
