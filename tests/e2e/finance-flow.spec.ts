import { expect, test } from "@playwright/test";

test("finance tabs keep valid aria-controls targets and support keyboard navigation", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /entrar como financeiro/i }).click();
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();

  const tabs = page.getByRole("tablist", { name: "Visões financeiras" }).getByRole("tab");
  await expect(tabs).toHaveCount(4);
  for (const tab of await tabs.all()) {
    const target = await tab.getAttribute("aria-controls");
    expect(target).toBeTruthy();
    await expect(page.locator(`#${target}`)).toHaveCount(1);
  }

  await tabs.first().focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Movimentações" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: "A receber" })).toBeFocused();
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
});
