import type { Order } from "@/features/orders/types";
import { paymentInstallmentLabel } from "@/features/orders/rules";
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
  const events: Array<OrderTimelineItem & { timestamp?: string | null }> = [
    { label: "Pesanan dibuat", date: timelineDate(order.createdAt), timestamp: order.createdAt },
  ];

  for (const payment of order.payments ?? []) {
    const installment = paymentInstallmentLabel(payment.installment);
    if (payment.paidAt) {
      events.push({
        label: `Bukti ${installment} diunggah${payment.status === "WAITING_VERIFICATION" ? " — menunggu verifikasi vendor" : ""}`,
        date: timelineDate(payment.paidAt),
        timestamp: payment.paidAt,
      });
    }
    if (payment.status === "REJECTED") {
      events.push({ label: `${installment} ditolak vendor`, date: timelineDate(payment.modifiedAt), timestamp: payment.modifiedAt });
    }
    if (payment.status === "PAID") {
      events.push({ label: `${installment} diverifikasi vendor`, date: timelineDate(payment.verifiedAt), timestamp: payment.verifiedAt });
    }
  }

  if (CONFIRMED_STATUSES.includes(order.status)) {
    events.push({ label: "Vendor mengonfirmasi pesanan", date: timelineDate(order.confirmedAt), timestamp: order.confirmedAt });
  }
  if (ACTIVE_EXECUTION_STATUSES.includes(order.status)) {
    if (order.status === "IN_PROGRESS") events.push({
      label: "Vendor memulai pengerjaan",
      date: timelineDate(order.modifiedAt),
      timestamp: order.modifiedAt,
    });
  }
  if (order.status === "WAITING_CUSTOMER_CONFIRMATION") {
    events.push({
      label: "Layanan selesai, menunggu konfirmasi customer",
      date: timelineDate(order.modifiedAt),
      timestamp: order.modifiedAt,
    });
  }
  if (order.status === "REJECTED_BY_VENDOR") {
    events.push({ label: "Pesanan ditolak vendor", date: timelineDate(order.modifiedAt), timestamp: order.modifiedAt });
  }
  if (order.status === "COMPLETED") {
    events.push({ label: "Pesanan diselesaikan oleh customer", date: timelineDate(order.completedAt), timestamp: order.completedAt });
  }
  return events
    .sort((left, right) => {
      if (!left.timestamp) return 1;
      if (!right.timestamp) return -1;
      return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
    })
    .map(({ label, date }) => ({ label, date }));
}

function timelineDate(value?: string | null) {
  return value ? formatDateTime(value) : null;
}
