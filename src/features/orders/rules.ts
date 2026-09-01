import type { Order, OrderPayment } from "./types";

const PROOF_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);
export const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;

export function canVendorDecide(order: Pick<Order, "status">) {
  return order.status === "WAITING_VENDOR_CONFIRMATION";
}

export function paymentInstallmentLabel(installment: OrderPayment["installment"]) {
  if (installment === "DP") return "DP";
  if (installment === "REMAINING") return "Pelunasan";
  return "Pembayaran penuh";
}

export function sortPaymentsByInstallment(payments: OrderPayment[] | undefined) {
  const priority: Record<OrderPayment["installment"], number> = { DP: 0, FULL: 0, REMAINING: 1 };
  return [...(payments ?? [])].sort((left, right) => priority[left.installment] - priority[right.installment]);
}

export function canSubmitPaymentProof(payment: Pick<OrderPayment, "status">) {
  return payment.status === "WAITING_PAYMENT" || payment.status === "REJECTED";
}

/** Returns the installment that currently needs the user's attention. */
export function getCurrentPayment(payments: OrderPayment[] | undefined) {
  if (!payments?.length) return undefined;
  const actionableStatuses = ["REJECTED", "WAITING_PAYMENT", "WAITING_VERIFICATION"];
  return [...payments].reverse().find((payment) => actionableStatuses.includes(payment.status)) ?? payments.at(-1);
}

export function validatePaymentProof(file: Pick<File, "size" | "type">): string | null {
  if (file.size > MAX_PAYMENT_PROOF_SIZE) return "Ukuran bukti pembayaran maksimal 5 MB.";
  if (!PROOF_TYPES.has(file.type)) return "Format bukti harus JPG, PNG, atau PDF.";
  return null;
}
