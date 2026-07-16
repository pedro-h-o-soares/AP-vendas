import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "../../app/routes";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import { sampleCheck } from "../../data/sampleData";
import type { Role } from "../../domain/types";
import {
  PrototypeStoreProvider,
  usePrototypeStore,
} from "../../state/PrototypeStore";
import { CheckDrawer } from "./CheckDrawer";
import { ChecksPage } from "./ChecksPage";
import { PostalShipmentForm } from "./PostalShipmentForm";

function RoleSession({ children, role }: { children: ReactNode; role: Role }) {
  const { user, signIn } = useAuth();
  return user ? children : (
    <button type="button" onClick={() => signIn(role)}>Entrar</button>
  );
}

async function renderWithSession(page: ReactNode, role: Role = "finance") {
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

function PostalHarness() {
  const { postalShipments } = usePrototypeStore();
  return (
    <>
      <PostalShipmentForm checkId={sampleCheck.id} />
      <output aria-label="Quantidade de postagens">{postalShipments.length}</output>
      <output aria-label="Último rastreio">{postalShipments.at(-1)?.trackingCode}</output>
      <output aria-label="Último status">{postalShipments.at(-1)?.status}</output>
    </>
  );
}

function CheckStatusHarness() {
  const { updateCheckStatus } = usePrototypeStore();
  return <><button type="button" onClick={() => updateCheckStatus(sampleCheck.id, "paid")}>Marcar cheque como pago</button><ChecksPage /></>;
}

describe("detalhe do cheque e postagem", () => {
  it("mostra titular, bom para, valor e todos os vínculos do cheque", () => {
    render(<CheckDrawer check={{ ...sampleCheck, usage: "Pagamento ao fornecedor" }} />);

    expect(screen.getAllByText(sampleCheck.owner)[0]).toBeVisible();
    expect(screen.getByText(/bom para/i)).toBeVisible();
    expect(screen.getByText(/R\$\s*6\.217,14/)).toBeVisible();
    [
      "Número", "Cliente", "Fornecedor", "Destinatário", "Responsável",
      "Forma de uso", "Status",
    ].forEach((label) => expect(screen.getByText(label)).toBeVisible());
  });

  it("exige serviço e destinatário antes de simular postagem e foca o primeiro erro", async () => {
    const user = await renderWithSession(<PostalShipmentForm checkId={sampleCheck.id} />);
    const service = screen.getByLabelText(/serviço postal/i);

    await user.click(screen.getByRole("button", { name: /simular postagem/i }));

    expect(screen.getByText(/selecione o serviço/i)).toBeVisible();
    expect(screen.getByText(/informe o destinatário/i)).toBeVisible();
    expect(service).toHaveFocus();
    expect(service).toHaveAttribute("aria-invalid", "true");
  });

  it("simula a postagem com rastreio e dados financeiros somente na sessão", async () => {
    const user = await renderWithSession(<PostalHarness />);
    expect(screen.getByLabelText(/quantidade de postagens/i)).toHaveTextContent("1");

    await user.selectOptions(screen.getByLabelText(/serviço postal/i), "pac");
    await user.type(screen.getByLabelText(/destinatário/i), "MADEPOL — Financeiro");
    await user.type(screen.getByLabelText(/^cidade$/i), "Curitiba");
    await user.selectOptions(screen.getByLabelText(/^estado$/i), "PR");
    await user.type(screen.getByLabelText(/custo da postagem/i), "28,90");
    await user.type(screen.getByLabelText(/^fatura$/i), "FAT-6217");
    await user.type(screen.getByLabelText(/valor pago/i), "20");
    await user.type(screen.getByLabelText(/valor a receber/i), "28,90");
    await user.type(screen.getByLabelText(/observações/i), "Cheque protegido e conferido");
    await user.click(screen.getByRole("button", { name: /simular postagem/i }));

    expect(screen.getByText(/postagem preparada somente nesta sessão/i)).toHaveAttribute("role", "status");
    expect(screen.getByLabelText(/quantidade de postagens/i)).toHaveTextContent("2");
    expect(screen.getByLabelText(/último rastreio/i)).toHaveTextContent(/^OG\d{9}BR$/);
    expect(screen.getByLabelText(/último status/i)).toHaveTextContent("prepared");
    expect(screen.getByText(/R\$\s*8,90/)).toBeVisible();
  });
});

describe("página de Cheques e Correios", () => {
  it("mostra o status atual do cheque na lista", async () => {
    const user = await renderWithSession(<CheckStatusHarness />);
    await user.click(screen.getByRole("button", { name: /marcar cheque como pago/i }));

    expect(screen.getByText("Pago")).toBeVisible();
    expect(screen.queryByText("A receber")).not.toBeInTheDocument();
  });

  it("alterna abas acessíveis e mostra os dados reais de MADEIRAS BETINI e PIGNATON", async () => {
    const user = await renderWithSession(<ChecksPage />);

    expect(screen.getByRole("tab", { name: "Cheques" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("MADEIRAS BETINI")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Correios" }));

    const pignaton = screen.getByRole("article", { name: /postagem para PIGNATON/i });
    [
      "PIGNATON (PEROBAS)", "Postagem (Ogura) - PAC", "AK199412308BR",
      "188 277 41", "Fatura", "Postado", "Previsão", "Entrega",
      "Valor pago", "Valor a receber", "Diferença", "Observações",
    ].forEach((value) => expect(within(pignaton).getByText(value)).toBeVisible());
    expect(within(pignaton).getByText(/R\$\s*16,38/)).toBeVisible();
  });

  it("atualiza em memória uma postagem preparada para postada e entregue", async () => {
    const user = await renderWithSession(<><PostalShipmentForm checkId={sampleCheck.id} /><ChecksPage /></>);
    await user.selectOptions(screen.getByLabelText(/serviço postal/i), "sedex");
    await user.type(screen.getByLabelText(/destinatário/i), "MADEPOL");
    const form = screen.getByLabelText(/serviço postal/i).closest("form")!;
    await user.click(within(form).getByRole("button", { name: /simular postagem/i }));
    await user.click(screen.getByRole("tab", { name: "Correios" }));

    const prepared = screen.getByRole("article", { name: /postagem para MADEPOL/i });
    await user.click(within(prepared).getByRole("button", { name: /marcar como postado/i }));
    expect(within(prepared).getAllByText("Postado")[0]).toBeVisible();
    await user.click(within(prepared).getByRole("button", { name: /marcar como entregue/i }));
    expect(within(prepared).getByText("Entregue")).toBeVisible();
  });
});

describe("rota e permissões de Cheques e Correios", () => {
  it.each(["admin", "finance"] as const)("permite leitura e ações para %s", async (role) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/cheques-correios"]}>
        <PrototypeStoreProvider>
          <AuthProvider>
            <RoleSession role={role}><AppRoutes /></RoleSession>
          </AuthProvider>
        </PrototypeStoreProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByRole("heading", { name: "Cheques e Correios" })).toBeVisible();
    expect(screen.getByRole("button", { name: /simular postagem/i })).toBeVisible();
    expect(within(screen.getByRole("navigation", { name: "Principal" })).getByRole("link", { name: "Cheques e Correios" })).toHaveAttribute("href", "/cheques-correios");
    await user.click(within(screen.getByRole("navigation", { name: /navegação móvel/i })).getByRole("button", { name: "Mais" }));
    expect(within(screen.getByRole("menu", { name: /mais destinos/i })).getByRole("menuitem", { name: "Cheques e Correios" })).toHaveAttribute("href", "/cheques-correios");
  });

  it("nega acesso direto e esconde a navegação do perfil comercial", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/cheques-correios"]}>
        <PrototypeStoreProvider>
          <AuthProvider>
            <RoleSession role="commercial"><AppRoutes /></RoleSession>
          </AuthProvider>
        </PrototypeStoreProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByRole("heading", { name: /acesso negado/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Cheques e Correios" })).not.toBeInTheDocument();
  });
});
