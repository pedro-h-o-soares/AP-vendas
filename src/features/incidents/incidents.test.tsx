import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import type { Role } from "../../domain/types";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { IncidentForm } from "./IncidentForm";
import { IncidentsPage } from "./IncidentsPage";

function RoleSession({ children, role }: { children: ReactNode; role: Role }) {
  const { user, signIn } = useAuth();
  return user ? children : <button type="button" onClick={() => signIn(role)}>Entrar</button>;
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

it.each(["item faltante", "produto incorreto", "outra divergência"])("offers incident type %s", async (type) => {
  await renderWithSession(<IncidentForm orderId="order-brasil-flora-3824" />);
  expect(screen.getByRole("option", { name: new RegExp(type, "i") })).toBeInTheDocument();
});

it("requires a description for another divergence", async () => {
  const user = await renderWithSession(<IncidentForm orderId="order-brasil-flora-3824" />);
  await user.selectOptions(screen.getByLabelText(/tipo de ocorrência/i), "other");
  await user.click(screen.getByRole("button", { name: /registrar ocorrência/i }));

  expect(screen.getByText(/descreva a outra divergência/i)).toBeVisible();
  expect(screen.getByLabelText(/descrição/i)).toHaveFocus();
});

it("creates an incident and records the supplier contact in memory", async () => {
  const user = await renderWithSession(<IncidentForm orderId="order-brasil-flora-3824" />);
  await user.selectOptions(screen.getByLabelText(/tipo de ocorrência/i), "missing-item");
  await user.click(screen.getByRole("button", { name: /registrar ocorrência/i }));

  expect(screen.getByRole("status")).toHaveTextContent(/ocorrência registrada somente nesta sessão/i);
  await user.click(screen.getByRole("button", { name: /acionar fornecedor/i }));
  expect(screen.getByText(/fornecedor acionado/i)).toBeVisible();
});

it("lists incident priority, relationships, owner and status", async () => {
  await renderWithSession(<IncidentsPage />);
  const row = screen.getByRole("row", { name: /item faltante/i });
  ["Alta", "SERMAD", "IMPERIO WOODS", "Não atribuído", "Aberta"].forEach((value) => {
    expect(within(row).getByText(value)).toBeVisible();
  });
});

it("keeps incident mutations unavailable without edit-logistics", async () => {
  await renderWithSession(<IncidentForm orderId="order-brasil-flora-3824" />, "finance");
  expect(screen.queryByRole("button", { name: /registrar ocorrência/i })).not.toBeInTheDocument();
  expect(screen.getByText(/perfil sem permissão para registrar ocorrências/i)).toBeVisible();
});
