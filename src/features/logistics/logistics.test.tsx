import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import { sampleShipment } from "../../data/sampleData";
import type { Role } from "../../domain/types";
import { PrototypeStoreProvider, usePrototypeStore } from "../../state/PrototypeStore";
import { DeliveryForm } from "./DeliveryForm";
import { LogisticsPage } from "./LogisticsPage";

function RoleSession({ children, role }: { children: ReactNode; role: Role }) {
  const { user, signIn } = useAuth();
  return user ? children : <button type="button" onClick={() => signIn(role)}>Entrar</button>;
}

function DeliveryHarness() {
  const { orders } = usePrototypeStore();
  const shipment = orders.find(({ shipment }) => shipment?.id === sampleShipment.id)?.shipment;
  return shipment ? <DeliveryForm shipment={shipment} /> : null;
}

function IncidentTransitHarness() {
  const { createIncident, orders } = usePrototypeStore();
  const order = orders.find(({ id }) => id === "order-brasil-flora-3824")!;
  return (
    <>
      <button
        type="button"
        onClick={() => createIncident({
          orderId: order.id,
          shipmentId: order.shipment?.id,
          clientName: order.clientName,
          supplierName: order.supplierName,
          title: "Item faltante",
          description: "Item faltante no desembarque",
          type: "missing-item",
        })}
      >
        Criar ocorrência em trânsito
      </button>
      <LogisticsPage />
    </>
  );
}

async function renderWithSession(page: ReactNode, role: Role = "admin") {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <PrototypeStoreProvider>
        <AuthProvider>
          <RoleSession role={role}>{page}</RoleSession>
        </AuthProvider>
      </PrototypeStoreProvider>
    </MemoryRouter>,
  );
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  return user;
}

it("records a simulated delivery after confirmation and appends its timeline event", async () => {
  const user = await renderWithSession(<DeliveryHarness />);

  await user.click(screen.getByRole("button", { name: /confirmar entrega/i }));
  const dialog = screen.getByRole("alertdialog", { name: /confirmar entrega/i });
  expect(dialog).toBeVisible();
  await user.click(within(dialog).getByRole("button", { name: /confirmar entrega/i }));

  expect(screen.getByRole("status")).toHaveTextContent(/entrega registrada somente nesta sessão/i);
  expect(screen.getByText(/entrega confirmada/i)).toBeVisible();
});

it("lists shipment data and shows the full load conference in a drawer", async () => {
  const user = await renderWithSession(<LogisticsPage />);

  expect(screen.getByRole("cell", { name: /101 comercio de madeiras/i })).toBeVisible();
  expect(screen.getByRole("cell", { name: /brasil flora/i })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /ver embarque 3824/i }));

  const drawer = screen.getByRole("dialog", { name: /embarque 3824/i });
  [
    "Informe de carga",
    "Guia de vendas",
    "Cópia do cliente",
    "Cópia do fornecedor",
    "Forma de pagamento",
    "Recibo do motorista",
    "Conferência do material",
  ].forEach((label) => expect(within(drawer).getByText(label)).toBeVisible());
});

it("keeps logistics mutations unavailable without edit-logistics", async () => {
  await renderWithSession(<DeliveryHarness />, "finance");

  expect(screen.queryByRole("button", { name: /confirmar entrega/i })).not.toBeInTheDocument();
  expect(screen.getByText(/perfil sem permissão para alterar a entrega/i)).toBeVisible();
});

it("keeps a shipped load in transit after an incident changes the order status", async () => {
  const user = await renderWithSession(<IncidentTransitHarness />);
  await user.click(screen.getByRole("button", { name: /criar ocorrência em trânsito/i }));

  const row = screen.getByRole("row", { name: /101 comercio de madeiras/i });
  expect(within(row).getByText("Em trânsito")).toBeVisible();
});
