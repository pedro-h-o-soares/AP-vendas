import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "../../app/routes";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import { sampleInstallment, sampleOverdueInstallment } from "../../data/sampleData";
import type { Role } from "../../domain/types";
import {
  PrototypeStoreProvider,
  usePrototypeStore,
} from "../../state/PrototypeStore";
import { CollectionsPanel } from "./CollectionsPanel";
import { FinancePage } from "./FinancePage";
import { PaymentForm } from "./PaymentForm";

function RoleSession({ children, role }: { children: ReactNode; role: Role }) {
  const { user, signIn } = useAuth();
  return user ? children : (
    <button type="button" onClick={() => signIn(role)}>
      Entrar
    </button>
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

function PaymentHarness() {
  const { installments, orders, payments } = usePrototypeStore();
  const installment = installments.find(({ id }) => id === sampleOverdueInstallment.id)!;
  const order = orders.find(({ id }) => id === installment.orderId)!;
  return (
    <>
      <PaymentForm installment={installment} />
      <output aria-label="Quantidade de movimentações">{payments.length}</output>
      <output aria-label="Valor realizado da parcela">{installment.actualAmount}</output>
      <output aria-label="Status da parcela">{installment.status}</output>
      <output aria-label="Status financeiro do pedido">{order.financialStatus}</output>
      <output aria-label="Diferença da última movimentação">{payments.at(-1)?.difference}</output>
    </>
  );
}

function PartialCollectionHarness() {
  const { installments } = usePrototypeStore();
  const installment = installments.find(({ id }) => id === sampleOverdueInstallment.id)!;
  return <><PaymentForm installment={installment} /><CollectionsPanel /></>;
}

describe("baixa financeira", () => {
  it("calcula a diferença entre R$ 6.217,14 e R$ 11.000,00", async () => {
    const user = await renderWithSession(
      <PaymentForm installment={{ ...sampleInstallment, expectedAmount: 6_217.14 }} />,
    );

    const amount = screen.getByLabelText(/valor pago/i);
    await user.clear(amount);
    await user.type(amount, "11000");

    expect(screen.getByText(/R\$\s*4\.782,86/)).toBeVisible();
  });

  it("oferece PIX, cheque, boleto, depósito e direto", async () => {
    await renderWithSession(<PaymentForm installment={sampleInstallment} />);
    const method = screen.getByLabelText(/meio de pagamento/i);

    ["PIX", "Cheque", "Boleto", "Depósito", "Direto"].forEach((label) => {
      expect(within(method).getByRole("option", { name: label })).toBeInTheDocument();
    });
  });

  it("exige os campos do cheque quando esse meio é selecionado", async () => {
    const user = await renderWithSession(<PaymentForm installment={sampleInstallment} />);
    await user.selectOptions(screen.getByLabelText(/meio de pagamento/i), "check");

    expect(screen.getByLabelText(/número do cheque/i)).toBeRequired();
    expect(screen.getByLabelText(/titular do cheque/i)).toBeRequired();
    expect(screen.getByLabelText(/bom para/i)).toBeRequired();
    expect(screen.queryByLabelText(/^banco$/i)).not.toBeInTheDocument();
  });

  it("exige dados bancários para depósito e oculta os campos do cheque", async () => {
    const user = await renderWithSession(<PaymentForm installment={sampleInstallment} />);
    await user.selectOptions(screen.getByLabelText(/meio de pagamento/i), "deposit");

    expect(screen.getByLabelText(/^banco$/i)).toBeRequired();
    expect(screen.getByLabelText(/agência/i)).toBeRequired();
    expect(screen.getByLabelText(/conta/i)).toBeRequired();
    expect(screen.queryByLabelText(/número do cheque/i)).not.toBeInTheDocument();
  });

  it("não oferece nova baixa para uma parcela já liquidada", async () => {
    await renderWithSession(<PaymentForm installment={sampleInstallment} />);

    expect(screen.queryByRole("button", { name: /registrar baixa/i })).not.toBeInTheDocument();
    expect(screen.getByText(/parcela já liquidada/i)).toBeVisible();
  });

  it("explica e foca um valor pago inválido", async () => {
    const user = await renderWithSession(<PaymentForm installment={sampleOverdueInstallment} />);
    const amount = screen.getByLabelText(/valor pago/i);
    await user.type(amount, "valor inválido");
    await user.click(screen.getByRole("button", { name: /registrar baixa/i }));

    expect(screen.getByText(/informe um valor pago válido/i)).toBeVisible();
    expect(amount).toHaveFocus();
    expect(amount).toHaveAttribute("aria-invalid", "true");
  });

  it("registra a baixa somente na memória da sessão", async () => {
    const user = await renderWithSession(<PaymentHarness />);
    expect(screen.getByLabelText(/quantidade de movimentações/i)).toHaveTextContent("1");

    const amount = screen.getByLabelText(/valor pago/i);
    await user.clear(amount);
    await user.type(amount, "1000");
    await user.selectOptions(screen.getByLabelText(/meio de pagamento/i), "direct");
    await user.click(screen.getByRole("button", { name: /registrar baixa/i }));

    expect(screen.getByText(/baixa registrada somente nesta sessão/i)).toHaveAttribute("role", "status");
    expect(screen.getByLabelText(/quantidade de movimentações/i)).toHaveTextContent("2");
    expect(screen.getByLabelText(/valor realizado da parcela/i)).toHaveTextContent("1000");
    expect(screen.getByLabelText(/status da parcela/i)).toHaveTextContent("partially-paid");
    expect(screen.getByLabelText(/status financeiro do pedido/i)).toHaveTextContent("partially-paid");
  });

  it("acumula pagamentos parciais sem sobrescrever o realizado", async () => {
    const user = await renderWithSession(<PaymentHarness />);
    const amount = screen.getByLabelText(/valor pago/i);
    await user.type(amount, "1000");
    await user.selectOptions(screen.getByLabelText(/meio de pagamento/i), "direct");
    await user.click(screen.getByRole("button", { name: /registrar baixa/i }));
    await user.clear(amount);
    await user.type(amount, "600");
    await user.click(screen.getByRole("button", { name: /registrar baixa/i }));

    expect(screen.getByLabelText(/valor realizado da parcela/i)).toHaveTextContent("1600");
    expect(screen.getByLabelText(/status da parcela/i)).toHaveTextContent("overpaid");
    expect(screen.getByLabelText(/diferença da última movimentação/i)).toHaveTextContent("68.97");
    expect(screen.getByText(/R\$\s*68,97/)).toBeVisible();
  });

  it("não liquida o pedido enquanto faltam parcelas previstas", async () => {
    const user = await renderWithSession(<PaymentHarness />);
    await user.type(screen.getByLabelText(/valor pago/i), "1531.03");
    await user.selectOptions(screen.getByLabelText(/meio de pagamento/i), "direct");
    await user.click(screen.getByRole("button", { name: /registrar baixa/i }));

    expect(screen.getByLabelText(/status da parcela/i)).toHaveTextContent("paid");
    expect(screen.getByLabelText(/status financeiro do pedido/i)).toHaveTextContent("partially-paid");
  });
});

describe("financeiro e cobranças", () => {
  it("mostra as quatro abas e todos os filtros financeiros", async () => {
    const user = await renderWithSession(<FinancePage />);

    ["A receber", "A pagar", "Cobranças", "Movimentações"].forEach((tab) => {
      expect(screen.getByRole("tab", { name: tab })).toBeVisible();
    });
    [
      /status financeiro/i,
      /vencimento/i,
      /cliente/i,
      /fornecedor/i,
      /região/i,
      /meio de pagamento/i,
    ].forEach((label) => expect(screen.getByLabelText(label)).toBeVisible());

    await user.click(screen.getByRole("tab", { name: "Cobranças" }));
    expect(screen.queryByLabelText(/status financeiro/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Movimentações" }));
    expect(screen.queryByLabelText(/status financeiro/i)).not.toBeInTheDocument();
  });

  it("filtra parcelas e abre o drawer com os dados financeiros completos", async () => {
    const user = await renderWithSession(<FinancePage />);
    await user.selectOptions(screen.getByLabelText(/meio de pagamento/i), "deposit");
    await user.click(screen.getByRole("button", { name: /ver parcela 1 de 1/i }));

    const drawer = screen.getByRole("dialog", { name: /parcela 1 de 1/i });
    [
      "Destinatário",
      "Valor previsto",
      "Valor realizado",
      "Vencimento",
      "Data da baixa",
      "Dados bancários",
      "Observações",
      "Pedido vinculado",
    ].forEach((label) => expect(within(drawer).getAllByText(label)[0]).toBeVisible());
  });

  it("registra contato de cobrança em memória", async () => {
    const user = await renderWithSession(<CollectionsPanel />);
    const collection = screen.getByRole("article", { name: /cobrança 101 comercio.*parcela 1/i });
    expect(within(collection).getByText(/R\$\s*1\.531,03/)).toBeVisible();
    expect(within(collection).getByText(/visita ou coleta/i)).toBeVisible();

    await user.type(within(collection).getByLabelText(/observação do contato/i), "Cliente confirmou coleta amanhã");
    await user.click(within(collection).getByRole("button", { name: /registrar contato/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/contato registrado somente nesta sessão/i);
    expect(screen.getByText("Cliente confirmou coleta amanhã")).toBeVisible();
    expect(within(collection).getByText("Último contato").parentElement).toHaveTextContent("2026-07-16");
  });

  it("lista todas as parcelas vencidas como cobranças", async () => {
    await renderWithSession(<CollectionsPanel />);
    expect(screen.getAllByRole("article", { name: /cobrança 101 comercio/i })).toHaveLength(5);
  });

  it("preserva o contato de cobrança ao navegar entre as abas da sessão", async () => {
    const user = await renderWithSession(<FinancePage />);
    await user.click(screen.getByRole("tab", { name: "Cobranças" }));
    const collection = screen.getByRole("article", { name: /cobrança 101 comercio.*parcela 1/i });
    await user.type(within(collection).getByLabelText(/observação do contato/i), "Retorno agendado na sessão");
    await user.click(within(collection).getByRole("button", { name: /registrar contato/i }));

    await user.click(screen.getByRole("tab", { name: "A receber" }));
    await user.click(screen.getByRole("tab", { name: "Cobranças" }));

    expect(screen.getByText("Retorno agendado na sessão")).toBeVisible();
  });

  it("mantém em cobrança uma parcela vencida parcialmente paga com o saldo aberto", async () => {
    const user = await renderWithSession(<PartialCollectionHarness />);
    const collection = screen.getByRole("article", { name: /cobrança 101 comercio.*parcela 1/i });
    await user.type(within(collection).getByLabelText(/observação do contato/i), "Contato preservado após parcial");
    await user.click(within(collection).getByRole("button", { name: /registrar contato/i }));

    await user.type(screen.getByLabelText(/valor pago/i), "1000");
    await user.selectOptions(screen.getByLabelText(/meio de pagamento/i), "direct");
    await user.click(screen.getByRole("button", { name: /registrar baixa/i }));

    const updatedCollection = screen.getByRole("article", { name: /cobrança 101 comercio.*parcela 1/i });
    expect(within(updatedCollection).getByText(/R\$\s*531,03/)).toBeVisible();
    expect(within(updatedCollection).getByText("Contato preservado após parcial")).toBeVisible();
  });

  it("usa a região do cliente quando o pedido não possui região própria", async () => {
    const user = await renderWithSession(<FinancePage />);
    const region = screen.getByLabelText(/região/i);

    expect(within(region).getByRole("option", { name: "Norte do Espírito Santo" })).toBeVisible();
    await user.selectOptions(region, "Norte do Espírito Santo");

    expect(screen.getAllByRole("row", { name: /3824/i })).toHaveLength(5);
    expect(screen.queryByRole("row", { name: /order-madepol-betini/i })).not.toBeInTheDocument();
  });

  it("implementa relações ARIA e navegação por teclado nas abas", async () => {
    const user = await renderWithSession(<FinancePage />);
    const receive = screen.getByRole("tab", { name: "A receber" });
    const payable = screen.getByRole("tab", { name: "A pagar" });
    const collections = screen.getByRole("tab", { name: "Cobranças" });
    const movements = screen.getByRole("tab", { name: "Movimentações" });

    expect(receive).toHaveAttribute("id", "finance-tab-receivable");
    expect(receive).toHaveAttribute("aria-controls", "finance-panel-receivable");
    expect(receive).toHaveAttribute("tabindex", "0");
    const panel = screen.getByRole("tabpanel", { name: "A receber" });
    expect(panel).toHaveAttribute("id", "finance-panel-receivable");
    expect(panel).toHaveAttribute("aria-labelledby", "finance-tab-receivable");

    receive.focus();
    await user.keyboard("{ArrowRight}");
    expect(payable).toHaveFocus();
    expect(payable).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(movements).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(collections).toHaveFocus();
    await user.keyboard("{Home}");
    expect(receive).toHaveFocus();
  });
});

describe("rota e permissões financeiras", () => {
  it.each(["admin", "finance"] as const)("permite leitura e edição para %s", async (role) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/financeiro"]}>
        <PrototypeStoreProvider>
          <AuthProvider>
            <RoleSession role={role}><AppRoutes /></RoleSession>
          </AuthProvider>
        </PrototypeStoreProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByRole("heading", { name: "Financeiro" })).toBeVisible();
    expect(screen.getByRole("button", { name: /registrar baixa/i })).toBeVisible();
    expect(within(screen.getByRole("navigation", { name: "Principal" })).getByRole("link", { name: "Financeiro" })).toHaveAttribute("href", "/financeiro");
    expect(within(screen.getByRole("navigation", { name: /navegação móvel/i })).getByRole("link", { name: "Financeiro" })).toHaveAttribute("href", "/financeiro");
  });

  it("nega acesso direto ao perfil comercial", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/financeiro"]}>
        <PrototypeStoreProvider>
          <AuthProvider>
            <RoleSession role="commercial"><AppRoutes /></RoleSession>
          </AuthProvider>
        </PrototypeStoreProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByRole("heading", { name: /acesso negado/i })).toBeVisible();
  });
});
