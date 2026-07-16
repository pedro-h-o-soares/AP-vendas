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

const expectIntentionalTableScroller = async (page: Page, table: ReturnType<Page["locator"]>) => {
  const scroller = table.locator("xpath=..")
  const firstCell = table.locator("tbody tr").first().locator("td").first();
  const lastCell = table.locator("tbody tr").first().locator("td").last();

  await expect(scroller).toHaveCSS("overflow-x", "auto");
  const geometry = await scroller.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeGreaterThanOrEqual(geometry.clientWidth);

  await scroller.evaluate((element) => { element.scrollLeft = 0; });
  await expect(firstCell).toBeInViewport();
  const firstGeometry = await scroller.evaluate((container) => {
    const element = container.querySelector<HTMLElement>("tbody tr:first-child td:first-child")!;
    const cellRect = element.getBoundingClientRect();
    const scrollerRect = container.getBoundingClientRect();
    return { cell: { left: cellRect.left, right: cellRect.right }, scroller: { left: scrollerRect.left, right: scrollerRect.right } };
  });
  expect(firstGeometry.cell.left, JSON.stringify(firstGeometry)).toBeGreaterThanOrEqual(firstGeometry.scroller.left - 1);
  expect(firstGeometry.cell.right, JSON.stringify(firstGeometry)).toBeLessThanOrEqual(firstGeometry.scroller.right + 1);
  await scroller.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  await expect(lastCell).toBeInViewport();
  const lastGeometry = await scroller.evaluate((container) => {
    const element = container.querySelector<HTMLElement>("tbody tr:first-child td:last-child")!;
    const cellRect = element.getBoundingClientRect();
    const scrollerRect = container.getBoundingClientRect();
    return { cell: { left: cellRect.left, right: cellRect.right }, scroller: { left: scrollerRect.left, right: scrollerRect.right } };
  });
  expect(lastGeometry.cell.left, JSON.stringify(lastGeometry)).toBeGreaterThanOrEqual(lastGeometry.scroller.left - 1);
  expect(lastGeometry.cell.right, JSON.stringify(lastGeometry)).toBeLessThanOrEqual(lastGeometry.scroller.right + 1);
};

const expectNoHiddenOverflowMask = async (page: Page) => {
  const hiddenMasks = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("body *"))
    .filter((element) => {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || style.overflowX !== "hidden") return false;
      const rect = element.getBoundingClientRect();
      const visuallyHidden = rect.width <= 1 || rect.height <= 1 || style.clip !== "auto" || style.clipPath !== "none";
      return !visuallyHidden && element.scrollWidth > element.clientWidth + 1;
    })
    .map((element) => ({
      className: String(element.className),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      tag: element.tagName,
    })));
  expect(hiddenMasks, JSON.stringify(hiddenMasks)).toEqual([]);
};

const expectDrawerControlsReachable = async (drawer: ReturnType<Page["locator"]>) => {
  await expect(drawer).toHaveCSS("overflow-y", "auto");
  const firstControl = drawer.locator(".drawer__content select, .drawer__content input, .drawer__content textarea, .drawer__content button").first();
  const lastControl = drawer.locator("select, input, textarea, button").last();
  await drawer.evaluate((element) => { element.scrollTop = 0; });
  await expect(firstControl).toBeInViewport();
  await lastControl.scrollIntoViewIfNeeded();
  await expect(lastControl).toBeInViewport();
  await expect(drawer).not.toHaveCSS("overflow-x", "hidden");
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
      const ordersTable = page.getByRole("table", { name: "Pedidos" });
      await expect(ordersTable).toBeVisible();
      await expectIntentionalTableScroller(page, ordersTable);
      await expectNoHiddenOverflowMask(page);
      await expectNoHorizontalOverflow(page);

      await page.getByRole("button", { name: "Novo orçamento" }).click();
      const drawer = page.getByRole("dialog", { name: "Novo orçamento" });
      await expectInsideViewport(page, drawer);
      await expectDrawerControlsReachable(drawer);
      await expectNoHiddenOverflowMask(page);
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
    const labelledCells = mobileTable.locator("tbody tr").first().locator("td[data-label]");
    await expect(labelledCells).toHaveCount(7);
    for (const cell of await labelledCells.all()) {
      await expect(cell).toHaveAttribute("data-label", /.+/);
      expect(await cell.evaluate((element) => getComputedStyle(element, "::before").content)).not.toBe("none");
      await expect(cell).not.toBeEmpty();
      await expectInsideViewport(page, cell);
      const contained = await cell.evaluate((element) => {
        const cellRect = element.getBoundingClientRect();
        const panelRect = element.closest<HTMLElement>(".orders-table-panel")!.getBoundingClientRect();
        return cellRect.left >= panelRect.left && cellRect.right <= panelRect.right;
      });
      expect(contained).toBe(true);
    }
    await expectInsideViewport(page, mobileTable.locator("tbody tr").first().getByRole("button", { name: "Ver pedido" }));
    await expectNoHiddenOverflowMask(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Novo orçamento" }).click();
    const drawer = page.getByRole("dialog", { name: "Novo orçamento" });
    await expectInsideViewport(page, drawer);
    await expectDrawerControlsReachable(drawer);
    await expectNoHiddenOverflowMask(page);
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
