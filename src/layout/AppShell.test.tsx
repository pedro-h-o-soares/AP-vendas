import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { AppShell } from "./AppShell";
import { MobileNav } from "./MobileNav";

function CommercialSession() {
  const { signIn } = useAuth();
  return <button onClick={() => signIn("commercial")} type="button">Sessão comercial</button>;
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
        <CommercialSession />
        <MobileNav />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: /sessão comercial/i }));
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pedidos/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /financeiro/i })).not.toBeInTheDocument();
  });
});
