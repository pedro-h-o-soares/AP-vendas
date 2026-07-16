import { expect, test, type Page } from "@playwright/test";

const noHorizontalOverflow = async (page: Page) => {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    landmarks: [".app-shell__content", ".orders-table-panel", ".data-table__scroll", ".dialog-backdrop", ".drawer"]
      .map((selector) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) return { selector };
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          clientWidth: element.clientWidth,
          left: rect.left,
          overflowX: style.overflowX,
          position: style.position,
          right: rect.right,
          scrollWidth: element.scrollWidth,
          selector,
          width: rect.width,
        };
      }),
    offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => ({
        className: element.className,
        right: element.getBoundingClientRect().right,
        tag: element.tagName,
      }))
      .filter(({ right }) => right > document.documentElement.clientWidth + 0.5)
      .slice(0, 8),
  }));
  return { ok: geometry.scrollWidth <= geometry.clientWidth, geometry };
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const result = await noHorizontalOverflow(page);
  expect(result.ok, JSON.stringify(result.geometry)).toBe(true);
};

const expectTouchTarget = async (locator: ReturnType<Page["locator"]>) => {
  const box = await locator.boundingBox();
  expect(box, "interactive control must have a rendered box").not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
};

const expectInsideViewport = async (page: Page, selector: ReturnType<Page["locator"]>) => {
  const box = await selector.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
};

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
      await expectNoHorizontalOverflow(page);

      const collapse = page.getByRole("button", { name: "Recolher menu" });
      await expectTouchTarget(collapse);
      await page.getByRole("link", { name: "Pedidos", exact: true }).click();
      await expect(page.getByRole("table", { name: "Pedidos" })).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.getByRole("button", { name: "Novo orçamento" }).click();
      const drawer = page.getByRole("dialog", { name: "Novo orçamento" });
      await expectInsideViewport(page, drawer);
      await expectNoHorizontalOverflow(page);
      const close = drawer.getByRole("button", { name: "Fechar Novo orçamento" });
      await expectTouchTarget(close);
      await close.click();

      await page.getByRole("button", { name: "Ver pedido" }).first().click();
      const backLink = page.getByRole("button", { name: /Pedidos/ });
      await expectTouchTarget(backLink);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ fullPage: true, path: testInfo.outputPath(`${viewport.name}.png`) });
    });
  }

  test("mobile uses the bottom navigation, role-aware overflow menu and 44px touch targets", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    for (const button of await page.getByRole("button", { name: /entrar como/i }).all()) {
      await expectTouchTarget(button);
    }

    await page.getByRole("button", { name: /entrar como administrador/i }).click();
    const navigation = page.getByRole("navigation", { name: "Navegação móvel" });
    await expect(navigation).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeHidden();
    await expectNoHorizontalOverflow(page);

    for (const control of await navigation.getByRole("link").all()) {
      await expectTouchTarget(control);
    }
    const more = navigation.getByRole("button", { name: "Mais" });
    await expectTouchTarget(more);
    await more.click();
    await expect(page.getByRole("menu", { name: "Mais destinos" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Cheques e Correios" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Usuários" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();

    await navigation.getByRole("link", { name: "Pedidos", exact: true }).click();
    const mobileTable = page.getByRole("table", { name: "Pedidos" });
    await expect(mobileTable).toBeVisible();
    await expect(mobileTable.locator("tbody tr").first()).toHaveCSS("display", "block");
    await expect(mobileTable.locator("tbody td").first()).toHaveCSS("display", "grid");
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Novo orçamento" }).click();
    const drawer = page.getByRole("dialog", { name: "Novo orçamento" });
    await expectInsideViewport(page, drawer);
    await expectNoHorizontalOverflow(page);
    const close = drawer.getByRole("button", { name: "Fechar Novo orçamento" });
    await expectTouchTarget(close);
    await close.click();

    await page.getByRole("button", { name: "Ver pedido" }).first().click();
    await expectTouchTarget(page.getByRole("button", { name: /Pedidos/ }));
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ fullPage: true, path: testInfo.outputPath("mobile.png") });
  });
});
