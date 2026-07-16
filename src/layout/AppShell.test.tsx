import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import type { Role } from "../domain/types";
import { AppShell } from "./AppShell";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

function SessionButton({ role }: { role: Role }) {
  const { signIn } = useAuth();
  return <button onClick={() => signIn(role)} type="button">Sessão {role}</button>;
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </AuthProvider>
  );
}

describe("responsive navigation", () => {
  it("toggles the desktop sidebar", async () => {
    const user = userEvent.setup();

    render(<Providers><AppShell><div>Conteúdo</div></AppShell></Providers>);

    await user.click(
      screen.getByRole("button", { name: /recolher menu/i }),
    );

    expect(
      screen.getByRole("navigation", { name: /principal/i }),
    ).toHaveAttribute("data-collapsed", "true");
  });

  it("shows no destinations without an authenticated profile", () => {
    render(<Providers><MobileNav /></Providers>);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("hides finance destinations from the commercial profile", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <SessionButton role="commercial" />
        <MobileNav />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: /sessão commercial/i }));
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pedidos/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /financeiro/i })).not.toBeInTheDocument();
  });

  it("opens authorized overflow destinations and restores focus with Escape", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <SessionButton role="admin" />
        <MobileNav />
      </Providers>,
    );
    await user.click(screen.getByRole("button", { name: /sessão admin/i }));

    const more = screen.getByRole("button", { name: "Mais" });
    expect(more).toHaveAttribute("aria-haspopup", "menu");
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);

    const menu = screen.getByRole("menu", { name: /mais destinos/i });
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(more).toHaveAttribute("aria-controls", menu.id);
    expect(within(menu).getByRole("menuitem", { name: "Clientes" })).toHaveAttribute("href", "/clientes");
    expect(within(menu).getByRole("menuitem", { name: "Fornecedores" })).toHaveAttribute("href", "/fornecedores");
    expect(within(menu).getByRole("menuitem", { name: "Ocorrências" })).toHaveAttribute("href", "/ocorrencias");
    expect(within(menu).getByRole("menuitem", { name: "Relatórios" })).toHaveAttribute("href", "/reports");
    expect(within(menu).getByRole("menuitem", { name: "Clientes" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: /mais destinos/i })).not.toBeInTheDocument();
    expect(more).toHaveFocus();
  });

  it("shows authorized logistics and incidents destinations in the sidebar", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <SessionButton role="commercial" />
        <Sidebar collapsed={false} onToggle={() => undefined} />
      </Providers>,
    );
    await user.click(screen.getByRole("button", { name: /sessão commercial/i }));

    const navigation = screen.getByRole("navigation", { name: /principal/i });
    expect(within(navigation).getByRole("link", { name: "Logística" })).toHaveAttribute("href", "/logistica");
    expect(within(navigation).getByRole("link", { name: "Ocorrências" })).toHaveAttribute("href", "/ocorrencias");
  });

  it("shows commercial party links but hides unauthorized overflow destinations", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <SessionButton role="commercial" />
        <MobileNav />
      </Providers>,
    );
    await user.click(screen.getByRole("button", { name: /sessão commercial/i }));
    await user.click(screen.getByRole("button", { name: "Mais" }));

    const menu = screen.getByRole("menu", { name: /mais destinos/i });
    expect(within(menu).getByRole("menuitem", { name: "Clientes" })).toBeVisible();
    expect(within(menu).getByRole("menuitem", { name: "Fornecedores" })).toBeVisible();
    expect(within(menu).queryByRole("menuitem", { name: "Relatórios" })).not.toBeInTheDocument();
  });

  it.each([
    ["admin", ["Dashboard", "Pedidos", "Logística", "Financeiro"], []],
    ["commercial", ["Dashboard", "Pedidos", "Logística"], ["Financeiro"]],
    ["finance", ["Dashboard", "Pedidos", "Financeiro"], ["Logística"]],
  ] as const)("filters sidebar destinations for %s", async (role, present, absent) => {
    const user = userEvent.setup();
    render(
      <Providers>
        <SessionButton role={role} />
        <Sidebar collapsed={false} onToggle={() => undefined} />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: `Sessão ${role}` }));
    const navigation = screen.getByRole("navigation", { name: /principal/i });

    present.forEach((label) => {
      expect(within(navigation).getByRole("link", { name: label })).toBeInTheDocument();
    });
    absent.forEach((label) => {
      expect(within(navigation).queryByRole("link", { name: label })).not.toBeInTheDocument();
    });
  });
});
