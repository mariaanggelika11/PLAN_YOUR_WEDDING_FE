import assert from "node:assert/strict";
import test from "node:test";
import {
  canPay,
  canUpload,
  orderActions,
  primaryRole,
  validSession,
  validateFile,
} from "../src/domain/rules.ts";
import {
  canPayOrder,
  canSubmitPaymentProof,
  canVendorDecide,
} from "../../src/features/orders/rules.ts";
import type { Order } from "../src/domain/contracts";
import { id, enErrors } from "../src/i18n/messages.ts";
import { planningText } from "../src/i18n/planning.ts";
import { createPlan } from "../../src/features/planning/model.ts";

test("native payment and vendor-decision visibility follows the existing web business rules", () => {
  const statuses: Order["status"][] = [
    "PENDING_PAYMENT",
    "WAITING_VENDOR_CONFIRMATION",
    "CONFIRMED",
    "IN_PROGRESS",
    "WAITING_CUSTOMER_CONFIRMATION",
    "COMPLETED",
    "CANCELLED",
    "REJECTED_BY_VENDOR",
    "DISPUTED",
  ];
  for (const active of [true, false])
    for (const status of statuses) {
      const order = { status, active };
      assert.equal(canPay(order), canPayOrder(order));
      for (const paymentStatus of [
        "WAITING_PAYMENT",
        "REJECTED",
        "WAITING_VERIFICATION",
        "PAID",
      ] as const)
        assert.equal(
          canUpload(order, { status: paymentStatus }),
          canPayOrder(order) && canSubmitPaymentProof({ status: paymentStatus }),
        );
      assert.equal(
        orderActions(order, "VENDOR").includes("confirm"),
        active && canVendorDecide(order),
      );
      assert.equal(
        orderActions(order, "ADMIN").includes("resolve-completed"),
        active && status === "DISPUTED",
      );
    }
});
test("sessions reject unsupported roles, malformed user IDs and expired tokens", () => {
  const session = {
    accessToken: "token",
    user: { id: 1, role: "CUSTOMER", name: "Test", email: "test@example.com" },
  };
  assert.equal(validSession(session), true);
  assert.equal(validSession({ ...session, expiresAt: 1 }), false);
  assert.equal(validSession({ ...session, expiresAt: "tomorrow" }), false);
  assert.equal(validSession({ ...session, user: { ...session.user, role: "OWNER" } }), false);
  assert.equal(validSession({ ...session, user: { ...session.user, id: -1 } }), false);
  assert.equal(primaryRole("administrator"), "ADMIN");
  assert.throws(() => primaryRole(undefined));
});
test("native files enforce the payment proof size and MIME limits", () => {
  for (const mimeType of ["image/png", "image/jpeg", "application/pdf"])
    assert.doesNotThrow(() => validateFile({ name: "test", mimeType, size: 100 }));
  assert.throws(() => validateFile({ name: "test.png", mimeType: "image/png", size: 0 }));
  assert.throws(() =>
    validateFile({ name: "test.png", mimeType: "image/png", size: 5 * 1024 * 1024 + 1 }),
  );
  assert.throws(() => validateFile({ name: "test.jpg", mimeType: "text/html", size: 100 }));
  assert.throws(() =>
    validateFile({ name: "test.pdf", mimeType: "application/pdf", size: 100 }, true),
  );
});
test("all stable native error codes have both Indonesian and English messages", () => {
  for (const [code, message] of Object.entries(enErrors)) {
    assert.ok(message);
    assert.ok(Object.hasOwn(id, code), code);
  }
});

test("native template translations preserve original saved titles and custom content", () => {
  const task = createPlan({
    date: "2027-10-24",
    event: "",
    guests: 100,
    budget: 0,
    location: "",
    traditional: true,
    outdoor: true,
    useWo: true,
  }).tasks[0];
  assert.equal(planningText(task, task.title, "en"), "Agree on your concept and priorities");
  assert.equal(planningText(task, task.title, "id"), task.title);
  assert.equal(planningText(task, "Custom family plan", "en"), "Custom family plan");
  assert.equal(planningText({ ...task, guide: "Custom guidance" }, task.title, "en"), task.title);
});
