import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthContext";
import { AppRoutes, routeTable } from "./routes";
import { PrototypeStoreProvider } from "../state/PrototypeStore";

function Providers({ children }: { children: React.ReactNode }) {
  return <PrototypeStoreProvider><AuthProvider>{children}</AuthProvider></PrototypeStoreProvider>;
}

function RouteProbe() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate("/administracao/usuarios")}>Abrir usuários diretamente</button>;
}

it("declares protected destinations with their permissions", () => {
  expect(routeTable.map(({ path, permission }) => ({ path, permission }))).toEqual([
    { path: "/dashboard", permission: "view-dashboard" },
    { path: "/pedidos", permission: "view-orders" },
    { path: "/clientes", permission: "view-parties" },
    { path: "/fornecedores", permission: "view-parties" },
    { path: "/logistica", permission: "view-logistics" },
    { path: "/ocorrencias", permission: "view-logistics" },
    { path: "/financeiro", permission: "view-finance" },
    { path: "/cheques-correios", permission: "view-checks" },
    { path: "/acertos", permission: "view-settlements" },
    { path: "/relatorios", permission: "view-reports" },
    { path: "/administracao/usuarios", permission: "manage-users" },
  ]);
});

it("aplica a matriz de acesso nas rotas finais", async () => {
  const user = userEvent.setup();
  render(
    <Providers>
      <MemoryRouter initialEntries={["/administracao/usuarios"]}>
        <RouteProbe />
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  );
  await user.click(screen.getByRole("button", { name: /entrar como financeiro/i }));
  await user.click(screen.getByRole("button", { name: /abrir usuários diretamente/i }));
  expect(screen.getByRole("heading", { name: /acesso negado/i })).toBeVisible();
});

it("does not expose access denied as a public destination", () => {
  render(
    <Providers>
      <MemoryRouter initialEntries={["/access-denied"]}>
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  );

  expect(screen.getByRole("heading", { name: "Ogura Rep" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /acesso negado/i })).not.toBeInTheDocument();
});

it("redirects protected destinations to login and enters with a demo profile", async () => {
  const user = userEvent.setup();

  render(
    <Providers>
      <MemoryRouter initialEntries={["/orders"]}>
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  );

  expect(screen.getByRole("heading", { name: "Ogura Rep" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /entrar como comercial/i }));
  expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
});
