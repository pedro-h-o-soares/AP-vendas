import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { OrdersPage } from "./OrdersPage";

function renderOrders() {
  return render(
    <MemoryRouter>
      <PrototypeStoreProvider>
        <OrdersPage />
      </PrototypeStoreProvider>
    </MemoryRouter>,
  );
}

it("filters orders by client and status", async () => {
  const user = userEvent.setup();
  renderOrders();

  await user.type(screen.getByRole("searchbox"), "101 COMERCIO");
  await user.selectOptions(screen.getByLabelText(/status/i), "shipment-informed");

  expect(screen.getByText(/101 COMERCIO DE MADEIRAS/i)).toBeVisible();
  expect(screen.queryByText("SERMAD")).not.toBeInTheDocument();
});

it("offers every operational filter and opens quote creation", async () => {
  const user = userEvent.setup();
  renderOrders();

  expect(screen.getByLabelText(/fornecedor/i)).toBeVisible();
  expect(screen.getByLabelText(/responsável/i)).toBeVisible();
  expect(screen.getByLabelText(/cidade/i)).toBeVisible();
  expect(screen.getByLabelText(/região/i)).toBeVisible();
  expect(screen.getByLabelText(/data do pedido/i)).toBeVisible();

  await user.click(screen.getByRole("button", { name: /novo orçamento/i }));
  expect(screen.getByRole("dialog", { name: /novo orçamento/i })).toBeVisible();
});
