import AxeBuilder from "@axe-core/playwright";
import { test, expect, signInFixture, json } from "./fixtures";

for (const locale of ["id", "en"] as const) {
  test(`public and customer pages fit a 320px screen in ${locale}`, async ({ page, context }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await context.addCookies([{ name: "pyw-locale", value: locale, url: "http://127.0.0.1:3107" }]);
    for (const path of ["/", "/login", "/register/customer"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        path,
      ).toBe(true);
    }
    await signInFixture(page, "CUSTOMER", locale);
    for (const path of ["/customer/dashboard", "/customer/orders/101", "/customer/checkout/10"]) {
      await page.goto(path);
      if (path.endsWith("dashboard"))
        await expect(page.getByRole("link", { name: "PYW-TEST-101", exact: true })).toBeVisible();
      else if (path.includes("orders/"))
        await expect(page.getByText("Gedung UBL", { exact: true })).toBeVisible();
      else await expect(page.locator('input[name="date"]')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        path,
      ).toBe(true);
    }
  });
}

test("keyboard users can skip navigation and reach the main content", async ({ page }) => {
  await signInFixture(page);
  await page.goto("/customer/dashboard");
  await expect(page.getByRole("link", { name: "View budget", exact: true })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("mobile drawer traps focus, passes axe, closes on Escape and restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInFixture(page);
  await page.goto("/customer/dashboard");
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("narrow tables can be scrolled with the keyboard without overflowing the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await signInFixture(page);
  await page.goto("/customer/orders");
  const region = page.getByRole("region", { name: "Recent orders", exact: true });
  await expect(region).toBeVisible();
  expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test("form helper text is associated with its input without becoming part of the label", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "pyw-locale", value: "en", url: "http://127.0.0.1:3107" }]);
  await page.goto("/login");
  const password = page.locator('input[name="password"]');
  await expect(password).toHaveAccessibleName("Password");
  await expect(password).toHaveAccessibleDescription("At least 8 characters.");
  await expect(password).toHaveAttribute("aria-describedby", /-message$/);
});

test("store tabs support arrow keys, Home and End with an associated panel", async ({ page }) => {
  await signInFixture(page);
  await page.route("**/backend-api/vendor-profile/2/store", (route) =>
    json(route, {
      id: 2,
      businessName: "Video Keren",
      description: "Original vendor description",
      categories: [],
      isVerified: true,
      portfolioAttachmentIds: [],
      stats: { productCount: 1, averageRating: 0, reviewCount: 0, soldCount: 1 },
    }),
  );
  await page.goto("/customer/vendors/2");
  const products = page.getByRole("tab", { name: "Products", exact: true });
  await products.focus();
  await page.keyboard.press("ArrowRight");
  const portfolio = page.getByRole("tab", { name: "Portfolio", exact: true });
  await expect(portfolio).toBeFocused();
  await expect(portfolio).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "About the store", exact: true })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("Original vendor description");
  await page.keyboard.press("Home");
  await expect(products).toBeFocused();
  await expect(products).toHaveAttribute("aria-selected", "true");
});

test("account popover returns keyboard focus to its trigger on Escape", async ({ page }) => {
  await signInFixture(page);
  await page.goto("/customer/dashboard");
  const trigger = page.getByRole("button", { name: /User:.*TU/ });
  await trigger.click();
  const logout = page.getByRole("button", { name: "Log out", exact: true });
  await logout.focus();
  await page.keyboard.press("Escape");
  await expect(logout).toBeHidden();
  await expect(trigger).toBeFocused();
});
