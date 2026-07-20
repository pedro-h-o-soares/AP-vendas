import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import type { Role } from "../../domain/types";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { OrdersPage } from "./OrdersPage";

function RoleSession({ children, role }: { children: ReactNode; role: Role }) {
  const { user, signIn } = useAuth();
  return user ? children : <button type="button" onClick={() => signIn(role)}>Entrar</button>;
}

async function renderOrders(role: Role = "admin") {
  const user = userEvent.setup();
  render(
    <MemoryRouter><PrototypeStoreProvider><AuthProvider>
      <RoleSession role={role}><OrdersPage /></RoleSession>
    </AuthProvider></PrototypeStoreProvider></MemoryRouter>,
  );
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  return user;
}

it("filters orders by client and status", async () => {
  const user = await renderOrders();
  await user.type(screen.getByRole("searchbox"), "101 COMERCIO");
  await user.selectOptions(screen.getByLabelText(/status/i), "shipment-informed");
  expect(screen.getByText(/101 COMERCIO DE MADEIRAS/i)).toBeVisible();
  expect(screen.queryByText("SERMAD")).not.toBeInTheDocument();
});

it("offers every operational filter and opens quote creation", async () => {
  const user = await renderOrders();
  expect(screen.getByLabelText(/fornecedor/i)).toBeVisible();
  expect(screen.getByLabelText(/responsável/i)).toBeVisible();
  expect(screen.getByLabelText(/cidade/i)).toBeVisible();
  expect(screen.getByLabelText(/região/i)).toBeVisible();
  expect(screen.getByLabelText(/período inicial/i)).toBeVisible();
  expect(screen.getByLabelText(/período final/i)).toBeVisible();
  await user.click(screen.getByRole("button", { name: /novo orçamento/i }));
  expect(screen.getByRole("dialog", { name: /novo orçamento/i })).toBeVisible();
});

it("keeps finance users read-only on the orders list", async () => {
  await renderOrders("finance");
  expect(screen.getByRole("table", { name: "Pedidos" })).toBeVisible();
  expect(screen.queryByRole("button", { name: /novo orçamento/i })).not.toBeInTheDocument();
});
