import { expect, test, type Page } from "@playwright/test";

const noHorizontalOverflow = async (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe("responsive shell", () => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
  ]) {
    test(`${viewport.name} uses the sidebar without horizontal overflow`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      await page.getByRole("button", { name: /entrar como administrador/i }).click();
      await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Navegação móvel" })).toBeHidden();
      expect(await noHorizontalOverflow(page)).toBe(true);
      await page.screenshot({ fullPage: true, path: testInfo.outputPath(`${viewport.name}.png`) });
    });
  }

  test("mobile uses the bottom navigation, role-aware overflow menu and 44px touch targets", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    for (const button of await page.getByRole("button", { name: /entrar como/i }).all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    await page.getByRole("button", { name: /entrar como administrador/i }).click();
    const navigation = page.getByRole("navigation", { name: "Navegação móvel" });
    await expect(navigation).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeHidden();
    expect(await noHorizontalOverflow(page)).toBe(true);

    for (const control of await navigation.getByRole("link").all()) {
      const box = await control.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    const more = navigation.getByRole("button", { name: "Mais" });
    const moreBox = await more.boundingBox();
    expect(moreBox?.height).toBeGreaterThanOrEqual(44);
    await more.click();
    await expect(page.getByRole("menu", { name: "Mais destinos" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Cheques e Correios" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Usuários" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await page.screenshot({ fullPage: true, path: testInfo.outputPath("mobile.png") });
  });
});
