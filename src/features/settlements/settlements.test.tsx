import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrototypeStoreProvider } from "../../state/PrototypeStore";
import { SettlementDetail } from "./SettlementDetail";
import { SettlementsPage } from "./SettlementsPage";

function renderSettlements(page: React.ReactNode) {
  return render(
    <MemoryRouter>
      <PrototypeStoreProvider>{page}</PrototypeStoreProvider>
    </MemoryRouter>,
  );
}

describe("acerto Santa Rita de junho de 2026", () => {
  it("concilia os totais e todos os grupos do relatório de acerto", () => {
    renderSettlements(<SettlementDetail settlementId="settlement-santa-rita-2026-06" />);

    expect(screen.getByRole("heading", { name: /relatório de acerto/i })).toBeVisible();
    expect(screen.getAllByText(/R\$\s*53\.929,63/)[0]).toBeVisible();
    [
      "Mercadoria", "Frete", "ICMS", "Sobra", "Falta", "Líquido",
      "Desconto à vista", "Comissão", "Total a pagar", "Pagamentos registrados",
      "Extras", "Saldo",
    ].forEach((label) => expect(screen.getAllByText(label)[0]).toBeVisible());
    expect(screen.getByText(/R\$\s*44\.987,00/)).toBeVisible();
    expect(screen.getByText(/R\$\s*6\.700,00/)).toBeVisible();
    expect(screen.getByText(/R\$\s*108,08/)).toBeVisible();
    expect(screen.getAllByText(/R\$\s*38\.178,92/)[0]).toBeVisible();
    const payments = screen.getByText("Pagamentos registrados").parentElement!;
    expect(payments).toHaveTextContent(/R\$\s*53\.929,63/);
    const row = screen.getByRole("row", { name: /SANTA CLARA MAT CONST/i });
    expect(within(row).getByRole("cell", { name: "SANTA CLARA MAT CONST" })).toHaveAttribute("data-label", "Cliente");
    expect(within(row).getByRole("cell", { name: /R\$\s*38\.178,92/ })).toHaveAttribute("data-label", "Líquido");
    expect(within(row).getByRole("cell", { name: /R\$\s*954,47/ })).toHaveAttribute("data-label", "Desconto");
    expect(within(row).getByRole("cell", { name: /R\$\s*1\.908,95/ })).toHaveAttribute("data-label", "Comissão");
    expect(within(row).getByRole("cell", { name: /R\$\s*35\.315,50/ })).toHaveAttribute("data-label", "A pagar");
  });

  it("filtra acertos por fornecedor e período e abre a prévia", async () => {
    const user = userEvent.setup();
    renderSettlements(<SettlementsPage />);

    await user.selectOptions(screen.getByLabelText(/fornecedor/i), "party-santa-rita");
    await user.selectOptions(screen.getByLabelText(/período/i), "2026-06");
    const table = screen.getByRole("table", { name: /acertos/i });
    expect(within(table).getByText("SANTA RITA")).toBeVisible();
    await user.click(within(table).getByRole("button", { name: /ver acerto santa rita/i }));
    expect(screen.getByRole("heading", { name: /relatório de acerto/i })).toBeVisible();
  });
});
