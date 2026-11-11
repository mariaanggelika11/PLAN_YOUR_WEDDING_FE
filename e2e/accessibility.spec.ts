import AxeBuilder from "@axe-core/playwright";
import { test, expect, signInFixture } from "./fixtures";

const publicPages = ["/", "/login", "/register/customer", "/forgot-password"];
for (const path of publicPages) {
  test(`accessible public page ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
for (const [role, path] of [
  ["CUSTOMER", "/customer/dashboard"],
  ["CUSTOMER", "/customer/orders/101"],
  ["CUSTOMER", "/customer/checkout/10"],
  ["CUSTOMER", "/customer/marketplace"],
  ["VENDOR", "/vendor/dashboard"],
  ["ADMIN", "/admin/dashboard"],
] as const) {
  test(`accessible ${path}`, async ({ page }) => {
    await signInFixture(page, role);
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    // Wait for the main fixture-backed content, not just the initial loading skeleton.
    if (path.includes("checkout"))
      await expect(
        page.getByRole("heading", { name: "Choose payment", exact: true }),
      ).toBeVisible();
    else if (path.includes("marketplace"))
      await expect(page.getByRole("heading", { name: "Rangga", exact: true })).toBeVisible();
    else if (path.includes("orders/"))
      await expect(page.getByRole("heading", { name: "Event details", exact: true })).toBeVisible();
    else await expect(page.getByRole("link", { name: "PYW-TEST-101", exact: true })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
