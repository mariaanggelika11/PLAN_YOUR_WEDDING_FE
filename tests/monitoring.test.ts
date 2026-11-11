import assert from "node:assert/strict";
import test from "node:test";
import type { ErrorEvent } from "@sentry/nextjs";
import { monitoringRoute, sanitizeMonitoringEvent } from "../src/shared/monitoring/privacy.ts";

test("monitoring keeps route structure and removes resource IDs, queries and fragments", () => {
  assert.equal(
    monitoringRoute("https://app.example/customer/orders/101?token=secret#bank"),
    "/customer/orders/[id]",
  );
  assert.equal(monitoringRoute("/vendor/marketplace/stores/42"), "/vendor/marketplace/[id]");
  assert.equal(monitoringRoute("/login?email=person@example.com"), "/login");
  assert.equal(monitoringRoute("/private/person@example.com"), "/[redacted]");
});

test("monitoring drops account, payment, form, request and exception values while preserving compiled frames", () => {
  const event: ErrorEvent = {
    type: undefined,
    event_id: "abcd",
    level: "error",
    release: "wedding@1",
    environment: "production",
    user: { id: "customer-101", email: "person@example.com", ip_address: "1.2.3.4" },
    request: {
      url: "https://app.example/customer/orders/101?token=super-secret",
      headers: { Authorization: "Bearer super-secret" },
      data: "password=super-secret",
      cookies: { session: "super-secret" },
    },
    message: "Payment failed for bank 1234567890",
    extra: { password: "super-secret", form: { accountNumber: "1234567890" } },
    contexts: { payment: { accountNumber: "1234567890" } },
    tags: { userId: "customer-101", surface: "react-boundary" },
    breadcrumbs: [{ message: "person@example.com", data: { token: "super-secret" } }],
    exception: {
      values: [
        {
          type: "TypeError",
          value: "super-secret person@example.com 1234567890",
          mechanism: { type: "generic", handled: true, data: { password: "super-secret" } },
          stacktrace: {
            frames: [
              {
                filename: "https://app.example/_next/static/chunks/app.js?token=super-secret",
                function: "render",
                lineno: 12,
                colno: 3,
                vars: { password: "super-secret" },
                context_line: "private source",
              },
            ],
          },
        },
      ],
    },
  };
  const original = structuredClone(event);
  const safe = sanitizeMonitoringEvent(event);
  const json = JSON.stringify(safe);
  for (const sensitive of [
    "super-secret",
    "person@example.com",
    "1234567890",
    "1.2.3.4",
    "customer-101",
    "private source",
    "Authorization",
    "cookies",
    "breadcrumbs",
  ])
    assert.equal(json.includes(sensitive), false, sensitive);
  assert.equal(safe.tags?.route, "/customer/orders/[id]");
  assert.equal(safe.exception?.values?.[0].type, "TypeError");
  assert.equal(
    safe.exception?.values?.[0].stacktrace?.frames?.[0].filename,
    "/_next/static/chunks/app.js",
  );
  assert.equal(safe.exception?.values?.[0].stacktrace?.frames?.[0].lineno, 12);
  assert.deepEqual(event, original);
});

test("API monitoring tags only include predefined categories and status codes", () => {
  const safe = sanitizeMonitoringEvent({
    type: undefined,
    tags: { surface: "api", failure: "SERVER_ERROR", http_status: "503", payment: "secret" },
  });
  assert.equal(safe.tags?.failure, "SERVER_ERROR");
  assert.equal(safe.tags?.http_status, "503");
  assert.equal(safe.tags?.payment, undefined);
  const unsafe = sanitizeMonitoringEvent({
    type: undefined,
    tags: { surface: "api", failure: "secret", http_status: "password=secret" },
  });
  assert.equal(unsafe.tags?.failure, undefined);
  assert.equal(unsafe.tags?.http_status, undefined);
});
