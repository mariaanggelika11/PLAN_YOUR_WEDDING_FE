import { translateInterfaceText, type TranslationVariables } from "../../shared/i18n/translate.ts";
import type { Order } from "@/features/orders/types";
import { paymentInstallmentLabel } from "@/features/orders/rules";
import type { OrderTimelineItem } from "@/shared/components/data-display/Commerce";
import { formatDateTime } from "@/shared/utils/formatDate";

const ACTIVE_EXECUTION_STATUSES: Order["status"][] = [
  "IN_PROGRESS",
  "WAITING_CUSTOMER_CONFIRMATION",
  "COMPLETED",
];

const CONFIRMED_STATUSES: Order["status"][] = ["CONFIRMED", ...ACTIVE_EXECUTION_STATUSES];

export function buildOrderTimeline(order: Order, locale: "id" | "en" = "id"): OrderTimelineItem[] {
  const translateUI = (text: string, variables?: TranslationVariables) =>
    translateInterfaceText(text, locale, variables);
  const events: Array<OrderTimelineItem & { timestamp?: string | null }> = [
    {
      label: translateUI("Pesanan dibuat"),
      date: timelineDate(order.createdAt, locale),
      timestamp: order.createdAt,
    },
  ];

  for (const payment of order.payments ?? []) {
    const installment = paymentInstallmentLabel(payment.installment, locale);
    if (payment.paidAt) {
      events.push({
        label: translateUI("Bukti {0} diunggah{1}", {
          0: installment,
          1:
            payment.status === "WAITING_VERIFICATION"
              ? translateUI(" — menunggu verifikasi vendor")
              : "",
        }),
        date: timelineDate(payment.paidAt, locale),
        timestamp: payment.paidAt,
      });
    }
    if (payment.status === "REJECTED") {
      events.push({
        label: translateUI("{0} ditolak vendor", { 0: installment }),
        date: timelineDate(payment.modifiedAt, locale),
        timestamp: payment.modifiedAt,
      });
    }
    if (payment.status === "PAID") {
      events.push({
        label: translateUI("{0} diverifikasi vendor", { 0: installment }),
        date: timelineDate(payment.verifiedAt, locale),
        timestamp: payment.verifiedAt,
      });
    }
  }

  if (CONFIRMED_STATUSES.includes(order.status)) {
    events.push({
      label: translateUI("Vendor mengonfirmasi pesanan"),
      date: timelineDate(order.confirmedAt, locale),
      timestamp: order.confirmedAt,
    });
  }
  if (ACTIVE_EXECUTION_STATUSES.includes(order.status)) {
    if (order.status === "IN_PROGRESS")
      events.push({
        label: translateUI("Vendor memulai pengerjaan"),
        date: timelineDate(order.modifiedAt, locale),
        timestamp: order.modifiedAt,
      });
  }
  if (order.status === "WAITING_CUSTOMER_CONFIRMATION") {
    events.push({
      label: translateUI("Layanan selesai, menunggu konfirmasi customer"),
      date: timelineDate(order.deliveredAt ?? order.modifiedAt, locale),
      timestamp: order.deliveredAt ?? order.modifiedAt,
    });
  }
  if (order.status === "REJECTED_BY_VENDOR") {
    events.push({
      label: translateUI("Pesanan ditolak vendor"),
      date: timelineDate(order.modifiedAt, locale),
      timestamp: order.modifiedAt,
    });
  }
  if (order.status === "COMPLETED") {
    events.push({
      label: translateUI("Pesanan selesai"),
      date: timelineDate(order.completedAt, locale),
      timestamp: order.completedAt,
    });
  }
  if (order.status === "CANCELLED" || order.status === "DISPUTED") {
    events.push({
      label:
        order.status === "CANCELLED"
          ? translateUI("Pesanan dibatalkan")
          : translateUI("Pesanan dalam sengketa"),
      date: timelineDate(order.modifiedAt, locale),
      timestamp: order.modifiedAt,
    });
  }
  return events
    .sort((left, right) => {
      if (!left.timestamp) return 1;
      if (!right.timestamp) return -1;
      return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
    })
    .map(({ label, date }) => ({ label, date }));
}

function timelineDate(value: string | null | undefined, locale: "id" | "en") {
  return value ? formatDateTime(value, locale) : null;
}
