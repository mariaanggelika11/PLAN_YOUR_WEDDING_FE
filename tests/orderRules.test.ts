import assert from "node:assert/strict";
import test from "node:test";
import { canSubmitPaymentProof, canVendorDecide, canVendorVerifyPayment, validatePaymentProof } from "../src/features/orders/rules.ts";

test("vendor hanya dapat mengambil keputusan saat menunggu konfirmasi", () => {
  assert.equal(canVendorDecide({ status: "WAITING_VENDOR_CONFIRMATION" }), true);
  assert.equal(canVendorDecide({ status: "PENDING_PAYMENT" }), false);
  assert.equal(canVendorDecide({ status: "CONFIRMED" }), false);
});

test("bukti dapat diunggah pertama kali atau setelah ditolak", () => {
  assert.equal(canSubmitPaymentProof({ status: "WAITING_PAYMENT" }), true);
  assert.equal(canSubmitPaymentProof({ status: "REJECTED" }), true);
  assert.equal(canSubmitPaymentProof({ status: "WAITING_VERIFICATION" }), false);
  assert.equal(canSubmitPaymentProof({ status: "PAID" }), false);
});

test("vendor hanya dapat memverifikasi bukti yang menunggu verifikasi", () => {
  assert.equal(canVendorVerifyPayment({ status: "WAITING_VERIFICATION" }), true);
  assert.equal(canVendorVerifyPayment({ status: "WAITING_PAYMENT" }), false);
  assert.equal(canVendorVerifyPayment({ status: "PAID" }), false);
  assert.equal(canVendorVerifyPayment({ status: "REJECTED" }), false);
});

test("validasi bukti pembayaran membatasi format dan ukuran", () => {
  assert.equal(validatePaymentProof({ size: 1024, type: "image/jpeg" }), null);
  assert.match(validatePaymentProof({ size: 1024, type: "text/plain" }) ?? "", /Format/);
  assert.match(validatePaymentProof({ size: 6 * 1024 * 1024, type: "image/png" }) ?? "", /5 MB/);
});
