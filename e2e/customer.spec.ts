import { test, expect, signInFixture, json, order } from "./fixtures";

for (const locale of ["id", "en"] as const) {
  test(`customer dashboard and order details use ${locale} without translating vendor data`, async ({
    page,
  }) => {
    await signInFixture(page, "CUSTOMER", locale);
    await page.goto("/customer/dashboard");
    await expect(
      page.getByRole("link", {
        name: locale === "en" ? "Wedding preparations" : "Persiapan pernikahan",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: locale === "en" ? "View budget" : "Lihat budget",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/customer/orders/101");
    await expect(
      page.getByRole("heading", {
        name: locale === "en" ? "Event details" : "Detail acara",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.locator("dt").filter({ hasText: new RegExp(locale === "en" ? "^Package$" : "^Paket$") }),
    ).toBeVisible();
    await expect(
      page
        .locator("dt")
        .filter({ hasText: new RegExp(locale === "en" ? "^Order status$" : "^Status pesanan$") }),
    ).toBeVisible();
    await expect(page.getByText("Video Keren", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Rangga", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Gedung UBL", { exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      locale === "en" ? "Status pesanan" : "Order status",
    );
  });
}

test("marketplace uses English sorting labels but sends original API enum values", async ({
  page,
}) => {
  await signInFixture(page);
  await page.goto("/customer/marketplace");
  await page.getByText("Filters and sorting", { exact: true }).click();
  const select = page.getByRole("combobox", { name: "Sort by", exact: true });
  await expect(select.locator('option[value="price_asc"]')).toHaveText("Lowest price");
  const query = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith("/vendor-products") &&
      new URL(request.url()).searchParams.get("sortBy") === "price_asc",
  );
  await select.selectOption("price_asc");
  await query;
  await expect(select).toHaveValue("price_asc");
});

test("failed data loads can recover through an explicit retry", async ({ page }) => {
  await signInFixture(page);
  let attempts = 0;
  await page.route("**/backend-api/orders?**", (route) => {
    attempts++;
    return attempts === 1
      ? json(route, { message: "Temporary failure" }, 503)
      : json(route, { data: [order], total: 1, pageNumber: 1, pageSize: 10 });
  });
  await page.goto("/customer/orders");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("cell", { name: "PYW-TEST-101", exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test("stalled API requests leave loading state after the deadline", async ({ page }) => {
  await signInFixture(page);
  await page.clock.install();
  let reached = false;
  await page.route("**/backend-api/budget/summary", () => {
    reached = true;
  });
  await page.goto("/customer/budget");
  await expect.poll(() => reached).toBe(true);
  await page.clock.fastForward(31_000);
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  await expect(
    page.getByText("The request timed out. Check the latest status before trying again.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("checkout waits for availability and preserves payment enums and numeric payloads", async ({
  page,
}) => {
  await signInFixture(page);
  let availabilityRequested = false;
  await page.route("**/backend-api/vendor-products/10/availability?**", () => {
    availabilityRequested = true;
  });
  let created = 0;
  let payload: Record<string, unknown> | undefined;
  await page.route("**/backend-api/orders", async (route) => {
    if (route.request().method() !== "POST") return json(route, { data: [], total: 0 });
    created++;
    payload = route.request().postDataJSON();
    await json(route, {
      ...order,
      status: "PENDING_PAYMENT",
      payments: [],
      paidAmount: 0,
      outstandingAmount: order.totalAmount,
    });
  });
  await page.goto("/customer/checkout/10");
  const submit = page.getByRole("button", {
    name: "Place order & continue to payment",
    exact: true,
  });
  await expect.poll(() => availabilityRequested).toBe(true);
  await expect(submit).toBeDisabled();
  await page.unroute("**/backend-api/vendor-products/10/availability?**");
  await page.locator('input[name="date"]').fill("2027-10-25");
  await page.locator('textarea[name="notes"]').fill("Fixture booking notes");
  await page.getByText("Pay in full", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /Pay in full/ })).toBeChecked();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page).toHaveURL("/customer/payment/101");
  expect(created).toBe(1);
  expect(payload).toMatchObject({
    vendorProductId: 10,
    eventDate: "2027-10-25",
    eventLocation: "Gedung UBL",
    guestCount: 1000,
    paymentType: "FULL",
  });
});

test("forbidden order responses never display another customer's details", async ({ page }) => {
  await signInFixture(page);
  await page.route("**/backend-api/orders/101", (route) =>
    json(route, { message: "Forbidden", code: "FORBIDDEN" }, 403),
  );
  await page.goto("/customer/orders/101");
  await expect(
    page.getByRole("heading", { name: "You do not have access", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Gedung UBL", { exact: true })).toHaveCount(0);
});

test("expired sessions are cleared when the API returns 401", async ({ page }) => {
  await signInFixture(page);
  await page.route("**/backend-api/budget/summary", (route) =>
    json(route, { message: "Session expired" }, 401),
  );
  await page.goto("/customer/budget");
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(await page.evaluate(() => localStorage.getItem("pyw_auth_session"))).toBeNull();
});

test("render failures show a localized boundary and recover on retry", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: "expected-boundary-error" });
  await signInFixture(page);
  await page.route("**/backend-api/dashboard/summary?**", (route) =>
    json(route, { role: "customer" }),
  );
  await page.goto("/customer/dashboard");
  await expect(
    page.getByRole("heading", { name: "This page could not be displayed", exact: true }),
  ).toBeVisible();
  await page.unroute("**/backend-api/dashboard/summary?**");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("link", { name: "View budget", exact: true })).toBeVisible();
});
