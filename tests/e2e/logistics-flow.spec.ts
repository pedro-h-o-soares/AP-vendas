import { expect, test } from "@playwright/test";

test("administrator confirms a delivery and records an incident with supplier follow-up", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /entrar como administrador/i }).click();
  await page.getByRole("link", { name: "Logística", exact: true }).click();

  const shipmentTrigger = page.getByRole("button", { name: /Ver embarque 3824/ });
  await shipmentTrigger.click();
  const shipmentDialog = page.getByRole("dialog", { name: "Embarque 3824" });
  await expect(shipmentDialog.getByText("Informe de carga")).toBeVisible();
  await expect(shipmentDialog.getByText("Conferência do material")).toBeVisible();
  await shipmentDialog.getByRole("button", { name: "Confirmar entrega" }).click();

  const confirmation = page.getByRole("alertdialog", { name: "Confirmar entrega" });
  await expect(confirmation.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await confirmation.getByRole("button", { name: "Confirmar entrega", exact: true }).click();
  await expect(shipmentDialog.getByRole("status")).toContainText("Entrega registrada");
  await shipmentDialog.getByRole("button", { name: "Fechar Embarque 3824" }).click();
  await expect(shipmentTrigger).toBeFocused();

  await page.getByRole("link", { name: "Ocorrências", exact: true }).click();
  await page.getByRole("button", { name: "Nova ocorrência" }).click();
  await page.getByLabel("Tipo de ocorrência").selectOption("other");
  await page.getByRole("button", { name: "Registrar ocorrência" }).click();
  await expect(page.getByText("Descreva a outra divergência.")).toBeVisible();
  await expect(page.getByLabel("Descrição")).toBeFocused();
  await page.getByLabel("Descrição").fill("Volume avariado no desembarque");
  await page.getByRole("button", { name: "Registrar ocorrência" }).click();
  await expect(page.getByRole("region", { name: "Ocorrência registrada" })).toBeVisible();
  await page.getByRole("button", { name: "Acionar fornecedor" }).click();
  await expect(page.getByText("Fornecedor acionado")).toBeVisible();
});
