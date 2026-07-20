import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import type { Role } from "../../domain/types";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { OrderDetailPage } from "./OrderDetailPage";

function RoleSession({ children, role }: { children: ReactNode; role: Role }) {
  const { user, signIn } = useAuth();
  return user ? children : <button type="button" onClick={() => signIn(role)}>Entrar</button>;
}

async function renderDetail(orderId = "order-brasil-flora-3824", role: Role = "admin", element: ReactNode = <OrderDetailPage />) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[`/pedidos/${orderId}`]}><PrototypeStoreProvider><AuthProvider>
      <RoleSession role={role}><Routes><Route path="/pedidos/:orderId" element={element} /></Routes></RoleSession>
    </AuthProvider></PrototypeStoreProvider></MemoryRouter>,
  );
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  return user;
}

it("renders the exact five order tabs and keeps the same order reference", async () => {
  const user = await renderDetail();
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Resumo", "Itens e valores", "Carga e entrega", "Financeiro", "Histórico"]);
  await user.click(screen.getByRole("tab", { name: "Carga e entrega" }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent("3824");
});

it("confirms an order action and appends it to the timeline", async () => {
  const user = await renderDetail();
  await user.click(screen.getByRole("button", { name: /marcar em trânsito/i }));
  await user.click(screen.getByRole("button", { name: /^confirmar$/i }));
  await user.click(screen.getByRole("tab", { name: "Histórico" }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent(/status alterado para em trânsito/i);
});

it("shows an order-not-found state", async () => {
  await renderDetail("missing-order");
  expect(screen.getByRole("heading", { name: /pedido não encontrado/i })).toBeVisible();
});

it("keeps finance users read-only while preserving every detail tab", async () => {
  await renderDetail("order-brasil-flora-3824", "finance");
  expect(screen.getAllByRole("tab")).toHaveLength(5);
  expect(screen.queryByRole("button", { name: /marcar em trânsito/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /marcar como entregue/i })).not.toBeInTheDocument();
});

it("shows translated order status in the summary", async () => {
  await renderDetail();
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Embarque informado");
  expect(screen.getByRole("tabpanel")).not.toHaveTextContent("shipment-informed");
});

it("keeps timeline actions after leaving and reopening the order", async () => {
  function RemountHarness() {
    const [mounted, setMounted] = useState(true);
    return mounted
      ? <><button type="button" onClick={() => setMounted(false)}>Sair do pedido</button><OrderDetailPage /></>
      : <button type="button" onClick={() => setMounted(true)}>Reabrir pedido</button>;
  }

  const user = await renderDetail("order-brasil-flora-3824", "admin", <RemountHarness />);
  await user.click(screen.getByRole("button", { name: /marcar em trânsito/i }));
  await user.click(screen.getByRole("button", { name: /^confirmar$/i }));
  await user.click(screen.getByRole("button", { name: /sair do pedido/i }));
  await user.click(screen.getByRole("button", { name: /reabrir pedido/i }));
  await user.click(screen.getByRole("tab", { name: "Histórico" }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent(/status alterado para em trânsito/i);
});
