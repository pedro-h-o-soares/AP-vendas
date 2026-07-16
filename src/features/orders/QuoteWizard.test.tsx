import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";
import { PrototypeStoreProvider, usePrototypeStore } from "../../state/PrototypeStore";
import { QuoteWizard } from "./QuoteWizard";

function StoreProbe() {
  const { orders } = usePrototypeStore();
  return <div data-testid="store-state">{JSON.stringify(orders.at(-1))}</div>;
}

function renderWizard() {
  return render(
    <PrototypeStoreProvider>
      <QuoteWizard open onClose={vi.fn()} />
      <StoreProbe />
    </PrototypeStoreProvider>,
  );
}

it("requires client, supplier and one item before confirming a quote", async () => {
  const user = userEvent.setup();
  renderWizard();

  await user.click(screen.getByRole("button", { name: /continuar/i }));
  expect(screen.getByText(/selecione um cliente/i)).toBeVisible();
  expect(screen.getByText(/selecione um fornecedor/i)).toBeVisible();
});

it("keeps per-item confirmations in the store and converts the confirmed quote", async () => {
  const user = userEvent.setup();
  renderWizard();

  await user.selectOptions(screen.getByLabelText("Cliente"), "party-101-madeiras");
  await user.selectOptions(screen.getByLabelText("Fornecedor"), "party-brasil-flora");
  await user.click(screen.getByRole("button", { name: /continuar/i }));

  await user.type(screen.getByLabelText(/descrição do item/i), "Tábuas de pinus");
  await user.clear(screen.getByLabelText(/quantidade/i));
  await user.type(screen.getByLabelText(/quantidade/i), "10");
  await user.click(screen.getByRole("button", { name: /adicionar item/i }));
  await user.type(screen.getByLabelText(/descrição do item/i), "Vigas de eucalipto");
  await user.clear(screen.getByLabelText(/quantidade/i));
  await user.type(screen.getByLabelText(/quantidade/i), "5");
  await user.click(screen.getByRole("button", { name: /adicionar item/i }));
  await user.click(screen.getByRole("button", { name: /continuar/i }));

  const stockFields = screen.getAllByLabelText(/estoque confirmado/i);
  await user.click(stockFields[0]);
  await user.click(stockFields[1]);
  const priceFields = screen.getAllByLabelText(/preço unitário/i);
  await user.type(priceFields[0], "25");
  await user.type(priceFields[1], "30");
  const leadTimeFields = screen.getAllByLabelText(/prazo/i);
  await user.type(leadTimeFields[0], "7 dias");
  await user.type(leadTimeFields[1], "14 dias");
  await user.click(screen.getByRole("button", { name: /continuar/i }));

  await user.type(screen.getByLabelText(/condições de pagamento/i), "30 dias");
  await user.click(screen.getByRole("button", { name: /continuar/i }));
  await user.click(screen.getByRole("button", { name: /confirmar orçamento/i }));

  expect(screen.getByRole("status")).toHaveTextContent(/orçamento confirmado/i);
  expect(screen.getByTestId("store-state")).toHaveTextContent('"status":"confirmed"');
  expect(screen.getByTestId("store-state")).toHaveTextContent('"unitPrice":25');
  expect(screen.getByTestId("store-state")).toHaveTextContent('"unitPrice":30');
  expect(screen.getByTestId("store-state")).toHaveTextContent('"leadTime":"14 dias"');
  await user.click(screen.getByRole("button", { name: /converter em pedido/i }));
  expect(screen.getByRole("status")).toHaveTextContent(/convertido em pedido/i);
});

it("starts a clean quote after closing and reopening the wizard", async () => {
  const user = userEvent.setup();

  function Harness() {
    const [open, setOpen] = useState(true);
    return <><button type="button" onClick={() => setOpen(true)}>Abrir</button><QuoteWizard open={open} onClose={() => setOpen(false)} /></>;
  }

  render(<PrototypeStoreProvider><Harness /></PrototypeStoreProvider>);
  await user.selectOptions(screen.getByLabelText("Cliente"), "party-101-madeiras");
  await user.selectOptions(screen.getByLabelText("Fornecedor"), "party-brasil-flora");
  await user.click(screen.getByRole("button", { name: /continuar/i }));
  expect(screen.getByLabelText(/descrição do item/i)).toBeVisible();

  await user.click(screen.getByRole("button", { name: /fechar novo orçamento/i }));
  await user.click(screen.getByRole("button", { name: "Abrir" }));

  const dialog = screen.getByRole("dialog", { name: /novo orçamento/i });
  expect(within(dialog).getByLabelText("Cliente")).toHaveValue("");
  expect(within(dialog).getByRole("button", { name: /continuar/i })).toBeVisible();
});
