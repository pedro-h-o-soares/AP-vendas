import { expect, test } from "@playwright/test";

test("finance tabs keep valid aria-controls targets and support keyboard navigation", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /entrar como financeiro/i }).click();
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();

  const tabs = page.getByRole("tablist", { name: "Visões financeiras" }).getByRole("tab");
  await expect(tabs).toHaveCount(4);
  const assertTabState = async (activeName: string) => {
    for (const tab of await tabs.all()) {
      const target = await tab.getAttribute("aria-controls");
      const active = (await tab.textContent()) === activeName;
      expect(target).toBeTruthy();
      await expect(tab).toHaveAttribute("aria-selected", String(active));
      await expect(tab).toHaveAttribute("tabindex", active ? "0" : "-1");
      await expect(page.locator(`#${target}`)).toHaveCount(1);
      await expect(page.locator(`#${target}`)).toHaveAttribute("tabindex", active ? "0" : "-1");
      if (active) await expect(page.locator(`#${target}`)).not.toHaveAttribute("hidden");
      else await expect(page.locator(`#${target}`)).toHaveAttribute("hidden", "");
    }
  };

  for (const tab of await tabs.all()) {
    const target = await tab.getAttribute("aria-controls");
    expect(target).toBeTruthy();
    await expect(page.locator(`#${target}`)).toHaveCount(1);
  }
  await assertTabState("A receber");

  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "A pagar" })).toBeFocused();
  await assertTabState("A pagar");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Movimentações" })).toBeFocused();
  await assertTabState("Movimentações");
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: "A receber" })).toBeFocused();
  await assertTabState("A receber");

  const focusStyle = await page.getByRole("tab", { name: "A receber" }).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      boxShadow: style.boxShadow,
      borderWidth: Number.parseFloat(style.borderWidth),
    };
  });
  expect(
    (focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth > 0)
      || focusStyle.boxShadow !== "none"
      || focusStyle.borderWidth > 1,
  ).toBe(true);

  const navigation = page.getByRole("navigation", { name: "Principal" });
  for (const name of ["Dashboard", "Pedidos", "Clientes", "Fornecedores", "Financeiro", "Cheques e Correios", "Acertos", "Relatórios"]) {
    await expect(navigation.getByRole("link", { name })).toBeVisible();
  }
  for (const name of ["Logística", "Ocorrências", "Usuários"]) {
    await expect(navigation.getByRole("link", { name })).toHaveCount(0);
  }
});

test("finance user records a PIX payment and sees the calculated difference", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /entrar como financeiro/i }).click();
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await page.getByRole("button", { name: "Registrar baixa" }).click();

  const dialog = page.getByRole("dialog", { name: /Parcela 1 de 5/ });
  await expect(dialog.getByText("Dados bancários")).toBeVisible();
  await expect(dialog.getByText("Pedido vinculado")).toBeVisible();
  await dialog.getByLabel("Valor pago").fill("1600");
  await expect(dialog.getByText("R$ 68,97")).toBeVisible();
  await dialog.getByLabel("Meio de pagamento").selectOption("pix");
  await dialog.getByLabel("Banco").fill("Banco demonstrativo");
  await dialog.getByLabel("Chave ou operação PIX").fill("PIX-123");
  await dialog.getByRole("button", { name: "Registrar baixa" }).click();
  await expect(dialog.getByRole("status")).toContainText("Baixa registrada");
  await dialog.getByRole("button", { name: /Fechar Parcela 1 de 5/ }).click();
  const updatedInstallment = page.getByRole("row").filter({ hasText: "1/5" });
  await expect(updatedInstallment).toContainText("R$ 1.600,00");
  await expect(updatedInstallment).toContainText("Com diferença");
  await page.getByRole("tab", { name: "Movimentações" }).click();
  await expect(page.getByText("R$ 1.600,00")).toBeVisible();
  await expect(page.getByText("PIX", { exact: true }).last()).toBeVisible();
});
