import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthContext";
import { AppRoutes, routeTable } from "./routes";

it("declares protected destinations with their permissions", () => {
  expect(routeTable.map(({ path, permission }) => ({ path, permission }))).toEqual([
    { path: "/dashboard", permission: "view-dashboard" },
    { path: "/orders", permission: "view-orders" },
    { path: "/logistics", permission: "view-logistics" },
    { path: "/finance", permission: "view-finance" },
    { path: "/checks", permission: "view-checks" },
    { path: "/settlements", permission: "view-settlements" },
    { path: "/reports", permission: "view-reports" },
    { path: "/users", permission: "manage-users" },
  ]);
});

it("does not expose access denied as a public destination", () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/access-denied"]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );

  expect(screen.getByRole("heading", { name: "Ogura Rep" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /acesso negado/i })).not.toBeInTheDocument();
});

it("redirects protected destinations to login and enters with a demo profile", async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/orders"]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );

  expect(screen.getByRole("heading", { name: "Ogura Rep" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /entrar como comercial/i }));
  expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
});
