import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { AnnualSupplierReport } from "./AnnualSupplierReport";
import { ReportsPage } from "./ReportsPage";

function renderReport(page: React.ReactNode) {
  return render(
    <MemoryRouter>
      <PrototypeStoreProvider>{page}</PrototypeStoreProvider>
    </MemoryRouter>,
  );
}

describe("relatórios operacionais", () => {
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
    expect(screen.getByRole("heading", { name: /controle anual.*brasil flora/i })).toBeVisible();
    expect(screen.getByText(/pedido 3824/i)).toBeVisible();
  });

  it("representa o controle anual Brasil Flora sem grade de 45 colunas", () => {
    renderReport(<AnnualSupplierReport supplierId="party-brasil-flora" year={2026} />);

    expect(screen.getByRole("heading", { name: /controle anual.*brasil flora/i })).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Mercadoria anual" })).getByText(/R\$\s*8\.593,75/)).toBeVisible();
    expect(within(screen.getByRole("article", { name: "Líquido anual" })).getByText(/R\$\s*7\.655,15/)).toBeVisible();
    expect(screen.getByText(/AK199412308BR/)).toBeVisible();
    for (const table of screen.getAllByRole("table")) {
      expect(within(table).getAllByRole("columnheader").length).toBeLessThan(10);
    }
  });
});
