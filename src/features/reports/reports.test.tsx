import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { AnnualSupplierReport } from "./AnnualSupplierReport";
import { ReportsPage } from "./ReportsPage";
import { selectAnnualSupplierOrders } from "./annualReport";
import { sampleOrders } from "../../data/sampleData";

function renderReport(page: React.ReactNode) {
  return render(
    <MemoryRouter>
      <PrototypeStoreProvider>{page}</PrototypeStoreProvider>
    </MemoryRouter>,
  );
}

describe("relatórios operacionais", () => {
  it("seleciona o ano pela data canônica e exclui pedidos sem data ou de outro ano", () => {
    const base = sampleOrders.find(({ supplierId }) => supplierId === "party-brasil-flora")!;
    const withoutDate = { ...base, id: "without-date", orderedAt: undefined, shipments: undefined };
    const orderedIn2027 = { ...base, id: "ordered-2027", orderedAt: "2027-02-10" as const, shipments: undefined };
    const orderedIn2026 = { ...base, id: "ordered-2026", orderedAt: "2026-05-09" as const, shipments: undefined };

    expect(selectAnnualSupplierOrders([withoutDate, orderedIn2027, orderedIn2026], "party-brasil-flora", 2026).map(({ id }) => id)).toEqual(["ordered-2026"]);
  });

  it("resume pedidos, financeiro, embarques, incidentes e comissões com filtros", async () => {
    const user = userEvent.setup();
    renderReport(<ReportsPage />);

    ["Pedidos", "Financeiro", "Embarques", "Incidentes", "Comissões"].forEach((name) => {
      expect(screen.getByRole("article", { name })).toBeVisible();
    });
    expect(screen.getByLabelText(/período inicial/i)).toBeVisible();
    expect(screen.getByLabelText(/período final/i)).toBeVisible();
    expect(screen.getByLabelText(/cliente/i)).toBeVisible();
    expect(screen.getByLabelText(/fornecedor/i)).toBeVisible();
    expect(screen.getByLabelText(/status do pedido/i)).toBeVisible();
    expect(screen.getByLabelText(/região/i)).toBeVisible();

    await user.selectOptions(screen.getByLabelText(/fornecedor/i), "party-brasil-flora");
    expect(within(screen.getByRole("article", { name: "Pedidos" })).getByText("1")).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Financeiro" })).getByText(/R\$\s*7\.655,15/)).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Embarques" })).getByText("1")).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Incidentes" })).getByText("0")).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Comissões" })).getByText(/R\$\s*0,00/)).toBeVisible();
    expect(screen.getByRole("heading", { name: /controle anual.*brasil flora/i })).toBeVisible();
    expect(screen.getByText(/pedido 3824/i)).toBeVisible();
  });

  it("soma a comissão real Santa Rita e obedece a combinação de fornecedor, cliente e status", async () => {
    const user = userEvent.setup();
    renderReport(<ReportsPage />);

    expect(within(screen.getByRole("article", { name: "Comissões" })).getByText(/R\$\s*1\.908,95/)).toBeVisible();
    await user.selectOptions(screen.getByLabelText(/fornecedor/i), "party-santa-rita");
    await user.selectOptions(screen.getByLabelText(/cliente/i), "party-santa-clara");
    await user.selectOptions(screen.getByLabelText(/status do pedido/i), "awaiting-client");

    expect(within(screen.getByRole("article", { name: "Pedidos" })).getByText("1")).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Comissões" })).getByText(/R\$\s*1\.908,95/)).toBeVisible();
    expect(within(screen.getByRole("table", { name: /pedidos do relatório/i })).getByText("SANTA RITA")).toBeVisible();
  });

  it("exclui registros sem data quando há limites e zera todos os resumos em intervalo futuro", async () => {
    const user = userEvent.setup();
    renderReport(<ReportsPage />);

    await user.type(screen.getByLabelText(/período inicial/i), "2027-01-01");
    await user.type(screen.getByLabelText(/período final/i), "2027-12-31");

    expect(within(screen.getByRole("article", { name: "Pedidos" })).getByText("0")).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Financeiro" })).getByText(/R\$\s*0,00/)).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Embarques" })).getByText("0")).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Incidentes" })).getByText("0")).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Comissões" })).getByText(/R\$\s*0,00/)).toBeVisible();
    expect(screen.getByText(/nenhum pedido encontrado/i)).toBeVisible();
  });

  it("aplica a região da parte relacionada aos pedidos e resumos", async () => {
    const user = userEvent.setup();
    renderReport(<ReportsPage />);
    await user.selectOptions(screen.getByLabelText(/região/i), "Norte do Espírito Santo");
    expect(within(screen.getByRole("article", { name: "Pedidos" })).getByText("1")).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Financeiro" })).getByText(/R\$\s*7\.655,15/)).toBeVisible();
  });

  it("representa o controle anual Brasil Flora sem grade de 45 colunas", () => {
    renderReport(<AnnualSupplierReport supplierId="party-brasil-flora" year={2026} />);

    expect(screen.getByRole("heading", { name: /controle anual.*brasil flora/i })).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Mercadoria anual" })).getByText(/R\$\s*8\.593,75/)).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Líquido anual" })).getByText(/R\$\s*7\.655,15/)).toBeVisible();
    expect(screen.queryByText(/AK199412308BR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/PIGNATON/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nenhuma postagem vinculada/i)).toBeVisible();
    expect(within(screen.getByRole("table", { name: /vencimentos anuais/i })).getAllByRole("row")).toHaveLength(6);
    for (const table of screen.getAllByRole("table")) {
      expect(within(table).getAllByRole("columnheader").length).toBeLessThan(10);
    }
  });
});
