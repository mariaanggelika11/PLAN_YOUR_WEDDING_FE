import type { Order, OrderPayment } from "./types";

const PROOF_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);
export const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;

export function canVendorDecide(order: Pick<Order, "status">) {
  return order.status === "WAITING_VENDOR_CONFIRMATION";
}

export function canVendorVerifyPayment(payment: Pick<OrderPayment, "status">) {
  return payment.status === "WAITING_VERIFICATION";
}

export function canSubmitPaymentProof(payment: Pick<OrderPayment, "status">) {
  return payment.status === "WAITING_PAYMENT" || payment.status === "REJECTED";
}

export function validatePaymentProof(file: Pick<File, "size" | "type">): string | null {
  if (file.size > MAX_PAYMENT_PROOF_SIZE) return "Ukuran bukti pembayaran maksimal 5 MB.";
  if (!PROOF_TYPES.has(file.type)) return "Format bukti harus JPG, PNG, atau PDF.";
  return null;
}
