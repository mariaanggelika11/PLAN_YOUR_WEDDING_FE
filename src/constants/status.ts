import type { OrderStatus, PaymentStatus, ProductStatus, VendorStatus } from "@/types";

export const vendorStatuses: VendorStatus[] = [
  "DRAFT",
  "PENDING_VERIFICATION",
  "VERIFIED_ACTIVE",
  "REJECTED",
  "SUSPENDED",
  "INACTIVE",
];
export const productStatuses: ProductStatus[] = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "DELETED",
  "REJECTED",
];
export const orderStatuses: OrderStatus[] = [
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
export const paymentStatuses: PaymentStatus[] = [
  "PENDING",
  "WAITING_PAYMENT",
  "WAITING_VERIFICATION",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REJECTED",
  "REFUNDED",
];

export const statusStyles: Record<string, string> = {
  VERIFIED_ACTIVE: "bg-emerald-100 text-emerald-700",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAID: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
  WAITING_PAYMENT: "bg-amber-100 text-amber-700",
  WAITING_VERIFICATION: "bg-amber-100 text-amber-700",
  WAITING_VENDOR_CONFIRMATION: "bg-amber-100 text-amber-700",
  WAITING_CUSTOMER_CONFIRMATION: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  REJECTED_BY_VENDOR: "bg-red-100 text-red-700",
  FAILED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-red-100 text-red-700",
  DISPUTED: "bg-red-100 text-red-700",
  DRAFT: "bg-stone-100 text-stone-700",
  INACTIVE: "bg-stone-100 text-stone-700",
  DELETED: "bg-stone-100 text-stone-700",
  CANCELLED: "bg-stone-100 text-stone-700",
  EXPIRED: "bg-stone-100 text-stone-700",
  REFUNDED: "bg-violet-100 text-violet-700",
};
