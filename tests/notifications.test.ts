import assert from "node:assert/strict";
import test from "node:test";
import { notificationDestination, notificationQuery } from "../src/features/notifications/rules.ts";

test("notification filters preserve false and server pagination", () => {
  assert.equal(
    notificationQuery({ pageNumber: 2, pageSize: 10, isRead: false }),
    "pageNumber=2&pageSize=10&isRead=false",
  );
  assert.equal(notificationQuery({ pageNumber: 1, pageSize: 5 }), "pageNumber=1&pageSize=5");
  assert.equal(
    notificationQuery({ pageNumber: 1, pageSize: 10, isRead: true }),
    "pageNumber=1&pageSize=10&isRead=true",
  );
});
test("notification actions only open safe same-role application routes", () => {
  assert.equal(
    notificationDestination("/customer/orders/42?tab=payment", "customer"),
    "/customer/orders/42?tab=payment",
  );
  assert.equal(notificationDestination("/vendor/orders/1", "vendor"), "/vendor/orders/1");
  for (const url of [
    null,
    "https://evil.test",
    "//evil.test",
    "javascript:alert(1)",
    "/admin/users",
    "/customer/../admin/users",
    "/customer/%2e%2e/admin/users",
    "/customer/\\evil.test",
    "/customer/%5cevil.test",
    "/customer/%broken",
  ])
    assert.equal(notificationDestination(url, "customer"), null);
});
