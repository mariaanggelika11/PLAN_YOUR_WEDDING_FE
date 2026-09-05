import assert from "node:assert/strict";
import test from "node:test";
import { canSubmitPaymentProof, canVendorDecide, getCurrentPayment, paymentInstallmentLabel, sortPaymentsByInstallment, validatePaymentProof } from "../src/features/orders/rules.ts";

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

test("validasi bukti pembayaran membatasi format dan ukuran", () => {
  assert.equal(validatePaymentProof({ size: 1024, type: "image/jpeg" }), null);
  assert.match(validatePaymentProof({ size: 1024, type: "text/plain" }) ?? "", /Format/);
  assert.match(validatePaymentProof({ size: 6 * 1024 * 1024, type: "image/png" }) ?? "", /5 MB/);
});

test("installment yang masih perlu diproses dipilih untuk pelunasan", () => {
  const payment = (id: string, status: "PAID" | "WAITING_PAYMENT") => ({ id, status });
  assert.equal(getCurrentPayment([payment("dp", "PAID"), payment("remaining", "WAITING_PAYMENT")] as never)?.id, "remaining");
  assert.equal(getCurrentPayment([payment("dp", "PAID")] as never)?.id, "dp");
});

test("jenis installment ditampilkan dengan label yang jelas", () => {
  assert.equal(paymentInstallmentLabel("DP"), "DP");
  assert.equal(paymentInstallmentLabel("FULL"), "Pembayaran penuh");
  assert.equal(paymentInstallmentLabel("REMAINING"), "Pelunasan");
});

test("riwayat pembayaran menampilkan pembayaran awal sebelum pelunasan", () => {
  const payments = [
    { id: "remaining", installment: "REMAINING" },
    { id: "dp", installment: "DP" },
  ] as never;
  assert.deepEqual(sortPaymentsByInstallment(payments).map((payment) => payment.id), ["dp", "remaining"]);
});
