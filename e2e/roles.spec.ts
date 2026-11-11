import { test, expect, signInFixture } from "./fixtures";

for (const role of ["VENDOR", "ADMIN"] as const) {
  test(`${role} dashboard renders with its English navigation`, async ({ page }) => {
    await signInFixture(page, role);
    await page.goto(`/${role.toLowerCase()}/dashboard`);
    await expect(page.getByRole("link", { name: "PYW-TEST-101", exact: true })).toBeVisible();
    if (role === "VENDOR")
      await expect(
        page.getByText("Your profile is active and can receive new orders.", { exact: true }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("link", { name: "Review vendor verifications", exact: true }),
      ).toBeVisible();
  });
}
