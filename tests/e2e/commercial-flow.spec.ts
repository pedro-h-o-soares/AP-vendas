import { expect, test } from "@playwright/test";

test("commercial user creates and converts a quote with stock, price, term and payment confirmations", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /entrar como comercial/i }).click();
  await page.getByRole("link", { name: "Pedidos", exact: true }).click();

  const trigger = page.getByRole("button", { name: "Novo orçamento" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Novo orçamento" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Fechar Novo orçamento" })).toBeFocused();

  await dialog.getByLabel("Cliente").selectOption({ label: "101 COMERCIO DE MADEIRAS LTDA ME" });
  await dialog.getByLabel("Fornecedor").selectOption({ label: "BRASIL FLORA" });
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByLabel("Descrição do item").fill("Porta de madeira maciça");
  await dialog.getByLabel("Quantidade").fill("2");
  await dialog.getByRole("button", { name: "Adicionar item" }).click();
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByLabel(/Estoque confirmado/).check();
  await dialog.getByLabel(/Preço unitário/).fill("850");
  await dialog.getByLabel(/Prazo/).fill("15 dias");
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByLabel("Condições de pagamento").fill("30/60 dias");
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await expect(dialog.getByRole("heading", { name: "Revisão do orçamento" })).toBeVisible();
  await dialog.getByRole("button", { name: "Confirmar orçamento" }).click();
  await expect(dialog.getByRole("status")).toContainText("Orçamento confirmado");
  await dialog.getByRole("button", { name: "Converter em pedido" }).click();
  await expect(dialog.getByRole("status")).toContainText(/convertido em pedido ORC-/);
  const orderNumber = (await dialog.getByRole("status").textContent())?.match(/ORC-\d{4}-\d+/)?.[0];
  expect(orderNumber).toBeTruthy();

  await dialog.getByRole("button", { name: "Fechar Novo orçamento" }).click();
  await expect(trigger).toBeFocused();
  const createdRow = page.getByRole("row").filter({ hasText: orderNumber! });
  await expect(createdRow).toContainText("101 COMERCIO DE MADEIRAS LTDA ME");
  await createdRow.getByRole("button", { name: "Ver pedido" }).click();
  await expect(page.getByRole("heading", { name: `Pedido ${orderNumber}` })).toBeVisible();
  await expect(page.getByText(`${orderNumber}`, { exact: false }).first()).toBeVisible();
});
