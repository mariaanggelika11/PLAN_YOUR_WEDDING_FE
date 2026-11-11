import { test, expect, signInFixture, json } from "./fixtures";
import type { Page } from "@playwright/test";

async function interceptEvents(page: Page) {
  const events: Record<string, unknown>[] = [];
  await page.route("https://monitoring.invalid/**", async (route) => {
    const lines = (route.request().postData() ?? "").split("\n");
    for (let i = 1; i < lines.length - 1; i++) {
      try {
        if (JSON.parse(lines[i]).type === "event") events.push(JSON.parse(lines[i + 1]));
      } catch {
        /* Envelope item was not an error event. */
      }
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  return events;
}

test("enabled monitoring captures an error boundary through a locally intercepted Sentry envelope", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: "expected-boundary-error" });
  const events = await interceptEvents(page);
  await signInFixture(page);
  await page.route("**/backend-api/dashboard/summary?**", (route) =>
    json(route, { role: "customer" }),
  );
  await page.goto("/customer/dashboard?email=person%40example.com&token=private-token");
  await expect(
    page.getByRole("heading", { name: "This page could not be displayed", exact: true }),
  ).toBeVisible();
  await expect.poll(() => events.length, { timeout: 15_000 }).toBeGreaterThan(0);
  const serialized = JSON.stringify(events);
  for (const sensitive of [
    "person@example.com",
    "private-token",
    "fixture-token",
    "Test Customer",
    "test@example.com",
  ])
    expect(serialized).not.toContain(sensitive);
  expect(
    events.some((event) => (event.tags as Record<string, string>)?.route === "/customer/dashboard"),
  ).toBe(true);
  for (const event of events) {
    expect(event.user).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.breadcrumbs).toBeUndefined();
  }
});

test("API monitoring ignores validation failures, reports server failures once, and omits response data", async ({
  page,
}) => {
  const events = await interceptEvents(page);
  await signInFixture(page);
  let status = 400;
  let requests = 0;
  await page.route("**/backend-api/dashboard/summary?**", (route) => {
    requests++;
    return json(route, { message: "private-response-test@example.com" }, status);
  });
  await page.goto("/customer/dashboard");
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  expect(events).toHaveLength(0);
  expect(requests).toBe(1);
  status = 500;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect
    .poll(
      () =>
        events.filter((event) => (event.tags as Record<string, string>)?.surface === "api").length,
    )
    .toBe(1);
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect.poll(() => requests).toBe(3);
  const apiEvents = events.filter(
    (event) => (event.tags as Record<string, string>)?.surface === "api",
  );
  expect(apiEvents).toHaveLength(1);
  expect(apiEvents[0].tags).toMatchObject({
    failure: "SERVER_ERROR",
    http_status: "500",
    route: "/customer/dashboard",
  });
  expect(JSON.stringify(events)).not.toContain("private-response-test@example.com");
});
