import test from "node:test";
import assert from "node:assert/strict";
import {
  apiErrorCode,
  shouldReloadResource,
  isForbiddenResource,
  apiErrorStatus,
} from "../src/shared/api/errorCodes.ts";
import { getPaymentSummary } from "../src/features/orders/rules.ts";
test("structured conflict codes trigger reload without depending on message language", () => {
  for (const code of [
    "ORDER_ALREADY_PROCESSED",
    "PAYMENT_ALREADY_PROCESSED",
    "INVALID_STATUS_TRANSITION",
    "DUPLICATE_REVIEW",
  ]) {
    assert.equal(shouldReloadResource({ payload: { code, message: "Pesan dapat berubah" } }), true);
  }
  assert.equal(shouldReloadResource({ payload: { code: "DATE_FULL" } }), false);
  assert.equal(shouldReloadResource(new Error("PAYMENT_ALREADY_PROCESSED")), false);
});
test("validation arrays and unstructured failures do not become machine codes", () => {
  assert.equal(apiErrorCode({ payload: { message: ["invalid"], statusCode: 400 } }), undefined);
  assert.equal(apiErrorCode(null), undefined);
  assert.equal(apiErrorCode({ payload: { code: 403 } }), undefined);
  assert.equal(apiErrorCode({ payload: { code: "ORDER_CLOSED" } }), "ORDER_CLOSED");
});
test("detail summaries use backend totals rather than incomplete client payment rows", () => {
  const summary = getPaymentSummary({
    totalAmount: 1000000,
    paidAmount: 750000,
    outstandingAmount: 250000,
    payments: [],
  });
  assert.equal(summary.paidAmount, 750000);
  assert.equal(summary.remainingAmount, 250000);
  assert.equal(summary.isFullyPaid, false);
  assert.equal(
    getPaymentSummary({ totalAmount: 1000000, paidAmount: 0, outstandingAmount: 1000000 })
      .paidAmount,
    0,
  );
});

test("ownership and missing resources use HTTP status or code instead of wording", () => {
  assert.equal(
    isForbiddenResource({ payload: { code: "FORBIDDEN_RESOURCE" }, message: "Changed wording" }),
    true,
  );
  assert.equal(isForbiddenResource({ status: 403 }), true);
  assert.equal(isForbiddenResource(new Error("forbidden")), false);
  assert.equal(apiErrorStatus({ status: 404 }), 404);
});
