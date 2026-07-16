import { expect, test } from "@playwright/test";

test("redirects anonymous visitors and exposes only the commercial role menu", async ({ page }) => {
  await page.goto("/financeiro");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("button", { name: /entrar como comercial/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const navigation = page.getByRole("navigation", { name: "Principal" });
  await expect(navigation.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Pedidos" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Logística" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Financeiro" })).toHaveCount(0);
  await expect(navigation.getByRole("link", { name: "Usuários" })).toHaveCount(0);

  await page.evaluate(() => {
    window.history.pushState({}, "", "/financeiro");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
});

test("administrator can navigate every module and collapse the sidebar", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /entrar como administrador/i }).click();

  const navigation = page.getByRole("navigation", { name: "Principal" });
  for (const name of ["Pedidos", "Clientes", "Fornecedores", "Logística", "Ocorrências", "Financeiro", "Cheques e Correios", "Acertos", "Relatórios", "Usuários"]) {
    await expect(navigation.getByRole("link", { name })).toBeVisible();
  }

  await page.getByRole("button", { name: "Recolher menu" }).click();
  await expect(navigation).toHaveAttribute("data-collapsed", "true");
  await expect(page.getByRole("button", { name: "Expandir menu" })).toBeFocused();
});
