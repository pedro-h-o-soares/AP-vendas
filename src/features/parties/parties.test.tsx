import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import type { Party, Role } from "../../domain/types";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { ClientsPage } from "./ClientsPage";
import { PartyForm } from "./PartyForm";
import { SuppliersPage } from "./SuppliersPage";

function RoleSession({ children, role }: { children: ReactNode; role: Role }) {
  const { user, signIn } = useAuth();
  return user ? children : <button type="button" onClick={() => signIn(role)}>Entrar</button>;
}

async function renderPage(page: ReactNode, role: Role = "admin") {
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

it("shows client contacts, conditions and linked operational history", async () => {
  const user = await renderPage(<ClientsPage />);

  await user.click(screen.getByRole("button", { name: /ver 101 comercio de madeiras/i }));

  const drawer = screen.getByRole("dialog", { name: /101 comercio de madeiras/i });
  expect(within(drawer).getByText("Linhares")).toBeVisible();
  expect(within(drawer).getByText("Contato demonstrativo 101")).toBeVisible();
  expect(within(drawer).getByText("(27) 99999-0101")).toBeVisible();
  expect(within(drawer).getByText("cliente.101@demo.ogura.local")).toBeVisible();
  expect(within(drawer).getByText("30/45/60/75/90")).toBeVisible();
  expect(screen.getByRole("heading", { name: /histórico de pedidos/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /embarques relacionados/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /resumo financeiro/i })).toBeVisible();
  expect(screen.getByText("3824")).toBeVisible();
  expect(within(drawer).getByText(/7\.655,15/)).toBeVisible();
});

it("shows supplier commission, cash discount and settlements", async () => {
  const user = await renderPage(<SuppliersPage />);

  await user.click(screen.getByRole("button", { name: /ver santa rita/i }));
  const drawer = screen.getByRole("dialog", { name: /santa rita/i });

  expect(screen.getByText("5,00%", { selector: "dd" })).toBeVisible();
  expect(screen.getByText("2,50%", { selector: "dd" })).toBeVisible();
  expect(screen.getByRole("heading", { name: /acertos relacionados/i })).toBeVisible();
  expect(screen.getByText("06/2026")).toBeVisible();
  expect(within(drawer).getByText("Contato demonstrativo Santa Rita")).toBeVisible();
  expect(within(drawer).getByText("(27) 99999-0202")).toBeVisible();
  expect(within(drawer).getByText("santa.rita@demo.ogura.local")).toBeVisible();
});

it("finds clients by phone", async () => {
  const user = await renderPage(<ClientsPage />);
  await user.type(screen.getByRole("searchbox", { name: /buscar clientes/i }), "99999-0101");

  expect(screen.getByRole("cell", { name: /^101 comercio de madeiras ltda me$/i })).toBeVisible();
  expect(screen.queryByText("SERMAD")).not.toBeInTheDocument();
});

it("finds suppliers by phone", async () => {
  const user = await renderPage(<SuppliersPage />);
  await user.type(screen.getByRole("searchbox", { name: /buscar fornecedores/i }), "99999-0202");

  expect(screen.getByText("SANTA RITA")).toBeVisible();
  expect(screen.queryByText("MADEPOL")).not.toBeInTheDocument();
});

it("excludes third-party recipient movements from the client financial summary", async () => {
  const user = await renderPage(<ClientsPage />);
  await user.click(screen.getByRole("button", { name: /ver madeiras betini/i }));
  const finance = screen.getByRole("heading", { name: /resumo financeiro/i }).closest("section");

  expect(finance).not.toBeNull();
  expect(within(finance as HTMLElement).getByText("A receber do cliente")).toBeVisible();
  expect(within(finance as HTMLElement).getByText("Recebido do cliente")).toBeVisible();
  expect(within(finance as HTMLElement).queryByText(/6\.217,14/)).not.toBeInTheDocument();
  expect(within(finance as HTMLElement).queryByText(/11\.000,00/)).not.toBeInTheDocument();
});

it("excludes third-party recipient movements from the supplier financial summary", async () => {
  const user = await renderPage(<SuppliersPage />);
  await user.click(screen.getByRole("button", { name: /ver madepol/i }));
  const finance = screen.getByRole("heading", { name: /resumo financeiro/i }).closest("section");

  expect(finance).not.toBeNull();
  expect(within(finance as HTMLElement).getByText("A pagar ao fornecedor")).toBeVisible();
  expect(within(finance as HTMLElement).getByText("Pago ao fornecedor")).toBeVisible();
  expect(within(finance as HTMLElement).queryByText(/6\.217,14/)).not.toBeInTheDocument();
  expect(within(finance as HTMLElement).queryByText(/11\.000,00/)).not.toBeInTheDocument();
});

it("validates name and at least one contact method", async () => {
  const user = userEvent.setup();
  const party: Party = { id: "new-client", kind: "client", name: "" };
  render(<PartyForm party={party} onCancel={() => undefined} onSave={() => undefined} />);

  await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

  expect(screen.getByText(/informe o nome ou razão social/i)).toBeVisible();
  expect(screen.getByText(/informe um telefone ou e-mail/i)).toBeVisible();
  expect(screen.getByLabelText(/nome ou razão social/i)).toHaveFocus();
});

it("simulates a client edit in memory for authorized profiles", async () => {
  const user = await renderPage(<ClientsPage />, "commercial");
  await user.click(screen.getByRole("button", { name: /ver 101 comercio de madeiras/i }));
  await user.click(screen.getByRole("button", { name: /editar cadastro/i }));
  const city = screen.getByLabelText("Cidade");
  await user.clear(city);
  await user.type(city, "Vitória");
  await user.type(screen.getByLabelText("Telefone"), "(27) 99999-0000");
  await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

  expect(screen.getByText(/cadastro atualizado somente nesta sessão/i)).toBeVisible();
  expect(screen.getByText("Vitória")).toBeVisible();
});

it("keeps finance users read-only while preserving client and supplier access", async () => {
  const user = await renderPage(<ClientsPage />, "finance");
  await user.click(screen.getByRole("button", { name: /ver 101 comercio de madeiras/i }));

  expect(screen.getByRole("dialog", { name: /101 comercio de madeiras/i })).toBeVisible();
  expect(screen.queryByRole("button", { name: /editar cadastro/i })).not.toBeInTheDocument();
});

it("keeps finance users read-only on the supplier directory", async () => {
  const user = await renderPage(<SuppliersPage />, "finance");
  await user.click(screen.getByRole("button", { name: /ver santa rita/i }));

  expect(screen.getByRole("dialog", { name: /santa rita/i })).toBeVisible();
  expect(screen.queryByRole("button", { name: /editar cadastro/i })).not.toBeInTheDocument();
});
