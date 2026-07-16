import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { OrderDetailPage } from "./OrderDetailPage";

function renderDetail(orderId = "order-brasil-flora-3824") {
  return render(
    <MemoryRouter initialEntries={[`/pedidos/${orderId}`]}>
      <PrototypeStoreProvider>
        <Routes>
          <Route path="/pedidos/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </PrototypeStoreProvider>
    </MemoryRouter>,
  );
}

it("renders the exact seven order tabs and keeps the same order reference", async () => {
  const user = userEvent.setup();
  renderDetail();

  const tabs = screen.getAllByRole("tab");
  expect(tabs.map((tab) => tab.textContent)).toEqual([
    "Resumo",
    "Itens e valores",
    "Comunicações",
    "Carga e entrega",
    "Financeiro",
    "Ocorrências",
    "Histórico",
  ]);

  await user.click(screen.getByRole("tab", { name: "Carga e entrega" }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent("3824");
});

it("confirms an order action and appends it to the timeline", async () => {
  const user = userEvent.setup();
  renderDetail();

  await user.click(screen.getByRole("button", { name: /marcar em trânsito/i }));
  await user.click(screen.getByRole("button", { name: /^confirmar$/i }));
  await user.click(screen.getByRole("tab", { name: "Histórico" }));

  expect(screen.getByRole("tabpanel")).toHaveTextContent(/status alterado para em trânsito/i);
});

it("shows an order-not-found state", () => {
  renderDetail("missing-order");
  expect(screen.getByRole("heading", { name: /pedido não encontrado/i })).toBeVisible();
});
