import type { Order } from "@/features/orders/types";
import type { OrderTimelineItem } from "@/shared/components/data-display/Commerce";
import { formatDateTime } from "@/shared/utils/formatDate";

const ACTIVE_EXECUTION_STATUSES: Order["status"][] = [
  "IN_PROGRESS",
  "WAITING_CUSTOMER_CONFIRMATION",
  "COMPLETED",
];

const CONFIRMED_STATUSES: Order["status"][] = [
  "CONFIRMED",
  ...ACTIVE_EXECUTION_STATUSES,
];

export function buildOrderTimeline(order: Order): OrderTimelineItem[] {
  const items: OrderTimelineItem[] = [
    { label: "Pesanan dibuat", date: timelineDate(order.createdAt) },
  ];
  const payment = order.payments?.[0];

  if (payment?.paidAt) {
    items.push({
      label:
        payment.status === "WAITING_VERIFICATION"
          ? "Bukti pembayaran menunggu verifikasi"
          : "Bukti pembayaran diunggah",
      date: timelineDate(payment.paidAt),
    });
  }
  if (payment?.status === "REJECTED") {
    items.push({ label: "Bukti pembayaran ditolak", date: timelineDate(payment.modifiedAt) });
  }
  if (payment?.status === "PAID") {
    items.push({ label: "Pembayaran diterima", date: timelineDate(payment.verifiedAt) });
  }

  if (CONFIRMED_STATUSES.includes(order.status)) {
    items.push({ label: "Vendor mengonfirmasi pesanan", date: timelineDate(order.confirmedAt) });
  }
  if (ACTIVE_EXECUTION_STATUSES.includes(order.status)) {
    items.push({
      label: "Vendor memulai pengerjaan",
      date: order.status === "IN_PROGRESS" ? timelineDate(order.modifiedAt) : null,
    });
  }
  if (["WAITING_CUSTOMER_CONFIRMATION", "COMPLETED"].includes(order.status)) {
    items.push({
      label: "Layanan selesai, menunggu konfirmasi customer",
      date: order.status === "WAITING_CUSTOMER_CONFIRMATION" ? timelineDate(order.modifiedAt) : null,
    });
  }
  if (order.status === "REJECTED_BY_VENDOR") {
    items.push({ label: "Pesanan ditolak vendor", date: timelineDate(order.modifiedAt) });
  }
  if (order.status === "COMPLETED") {
    items.push({ label: "Pesanan diselesaikan oleh customer", date: timelineDate(order.completedAt) });
  }

  return items;
}

function timelineDate(value?: string | null) {
  return value ? formatDateTime(value) : null;
}
