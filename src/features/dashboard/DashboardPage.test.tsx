import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import type { Role } from "../../domain/types";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { DashboardPage } from "./DashboardPage";

function Session({ children }: { children: ReactNode }) {
  const { user, signIn } = useAuth();
  return user ? children : (
    <>
      <button type="button" onClick={() => signIn("admin")}>Admin</button>
      <button type="button" onClick={() => signIn("commercial")}>Comercial</button>
      <button type="button" onClick={() => signIn("finance")}>Financeiro</button>
    </>
  );
}

async function renderDashboard(role: Role) {
  const user = userEvent.setup();
  render(
    <PrototypeStoreProvider>
      <AuthProvider>
        <Session><DashboardPage /></Session>
      </AuthProvider>
    </PrototypeStoreProvider>,
  );
  const labels: Record<Role, string> = {
    admin: "Admin",
    commercial: "Comercial",
    finance: "Financeiro",
  };
  await user.click(screen.getByRole("button", { name: labels[role] }));
}

it("shows operational priorities before financial summary for admins", async () => {
  await renderDashboard("admin");

  const priorities = screen.getByRole("heading", { name: /prioridades de hoje/i });
  const finance = screen.getByRole("heading", { name: /resumo financeiro/i });
  expect(priorities.compareDocumentPosition(finance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("keeps finance hidden from commercial users", async () => {
  await renderDashboard("commercial");

  expect(screen.getByRole("heading", { name: /prioridades de hoje/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /pedidos recentes/i })).toBeVisible();
  expect(screen.queryByRole("heading", { name: /resumo financeiro/i })).not.toBeInTheDocument();
});

it("shows finance below operations for finance users", async () => {
  await renderDashboard("finance");

  const priorities = screen.getByRole("heading", { name: /prioridades de hoje/i });
  const finance = screen.getByRole("heading", { name: /resumo financeiro/i });
  expect(priorities.compareDocumentPosition(finance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("provides operational filters and a persistent prototype notice", async () => {
  await renderDashboard("admin");

  expect(screen.getByRole("combobox", { name: "Período" })).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Responsável" })).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Fornecedor" })).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Região" })).toBeVisible();
  expect(screen.getByRole("note")).toHaveTextContent(/protótipo sem gravação permanente/i);
  expect(screen.getByText("SERMAD")).toBeVisible();
});
