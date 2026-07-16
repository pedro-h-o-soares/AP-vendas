import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { sampleUsers } from "../../data/sampleData";
import type { UserProfile } from "../../domain/types";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { UserForm } from "./UserForm";
import { UsersPage } from "./UsersPage";

function renderAdmin(page: React.ReactNode) {
  return render(
    <MemoryRouter>
      <PrototypeStoreProvider>{page}</PrototypeStoreProvider>
    </MemoryRouter>,
  );
}

function SwitchingUserForm() {
  const [selected, setSelected] = useState<UserProfile | undefined>(sampleUsers[0]);
  return <><button type="button" onClick={() => setSelected(undefined)}>Novo</button><button type="button" onClick={() => setSelected(sampleUsers[1])}>Editar Comercial</button><UserForm user={selected} /></>;
}

describe("administração de usuários", () => {
  it("valida e cria um usuário simulado com nome, email, papel e estado ativo", async () => {
    const user = userEvent.setup();
    renderAdmin(<UserForm />);

    await user.click(screen.getByRole("button", { name: /salvar usuário/i }));
    expect(screen.getByText(/informe o nome/i)).toBeVisible();
    expect(screen.getByText(/informe um e-mail válido/i)).toBeVisible();
    await user.type(screen.getByLabelText(/^nome$/i), "Ana Comercial");
    await user.type(screen.getByLabelText(/e-mail/i), "ana@ogurarep.local");
    await user.selectOptions(screen.getByLabelText(/papel/i), "commercial");
    expect(screen.getByLabelText(/usuário ativo/i)).toBeChecked();
    await user.click(screen.getByRole("button", { name: /salvar usuário/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/usuário criado somente nesta sessão/i);
  });

  it("sincroniza os campos ao alternar de usuário A para novo e depois para B", async () => {
    const user = userEvent.setup();
    renderAdmin(<SwitchingUserForm />);
    let name = screen.getByLabelText(/^nome$/i);
    expect(name).toHaveValue("Ogura Rep");
    await user.clear(name);
    await user.type(name, "Rascunho antigo");

    await user.click(screen.getByRole("button", { name: "Novo" }));
    name = screen.getByLabelText(/^nome$/i);
    let email = screen.getByLabelText(/e-mail/i);
    expect(name).toHaveValue("");
    expect(email).toHaveValue("");
    expect(screen.getByLabelText(/papel/i)).toHaveValue("commercial");
    expect(screen.getByLabelText(/usuário ativo/i)).toBeChecked();

    await user.type(name, "Outro rascunho");
    await user.click(screen.getByRole("button", { name: /editar comercial/i }));
    name = screen.getByLabelText(/^nome$/i);
    email = screen.getByLabelText(/e-mail/i);
    expect(name).toHaveValue("Comercial");
    expect(email).toHaveValue("comercial@ogurarep.local");
    expect(screen.getByLabelText(/papel/i)).toHaveValue("commercial");
  });

  it("exibe a matriz completa de permissões dos três perfis", () => {
    renderAdmin(<UsersPage />);
    const matrix = screen.getByRole("table", { name: /matriz de permissões/i });
    expect(within(matrix).getByRole("columnheader", { name: "Administrador" })).toBeVisible();
    expect(within(matrix).getByRole("columnheader", { name: "Comercial" })).toBeVisible();
    expect(within(matrix).getByRole("columnheader", { name: /Financeiro/i })).toBeVisible();
    ["Dashboard", "Pedidos", "Clientes e fornecedores", "Logística", "Financeiro", "Cheques e Correios", "Acertos", "Relatórios", "Usuários"].forEach((permission) => {
      expect(within(matrix).getByRole("rowheader", { name: permission })).toBeVisible();
    });
  });

  it("exige confirmação antes de desativar e atualiza a sessão", async () => {
    const user = userEvent.setup();
    renderAdmin(<UsersPage />);
    const row = screen.getByRole("row", { name: /Comercial comercial@ogurarep\.local/i });

    await user.click(within(row).getByRole("button", { name: /desativar comercial/i }));
    expect(screen.getByRole("alertdialog", { name: /desativar usuário/i })).toBeVisible();
    expect(within(row).getByText("Ativo")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /confirmar desativação/i }));
    expect(within(row).getByText("Inativo")).toBeVisible();
  });
});
