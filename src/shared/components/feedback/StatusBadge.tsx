"use client";

import { statusStyles } from "@/shared/config/status";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";

export function StatusBadge({ status }: { status: string }) {
  const { t, locale } = useTranslation();
  const statusLabels: Record<string, string> = {
    ACTIVE: t("status.active"),
    DRAFT: t("status.draft"),
    INACTIVE: t("status.inactive"),
    REJECTED: t("status.rejected"),
    VERIFIED: t("status.verified"),
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status] ?? "bg-stone-100 text-stone-700",
      )}
    >
      {statusLabels[status] ??
        extendedStatusLabels[status]?.[locale] ??
        status.replaceAll("_", " ")}
    </span>
  );
}

const extendedStatusLabels: Record<string, Record<"id" | "en", string>> = {
  VERIFIED_ACTIVE: { id: "Terverifikasi & aktif", en: "Verified & active" },
  PENDING_VERIFICATION: { id: "Menunggu verifikasi", en: "Awaiting verification" },
  SUSPENDED: { id: "Ditangguhkan", en: "Suspended" },
  DELETED: { id: "Dihapus", en: "Deleted" },
  PENDING: { id: "Menunggu", en: "Pending" },
  PENDING_PAYMENT: { id: "Menunggu pembayaran", en: "Awaiting payment" },
  WAITING_PAYMENT: { id: "Menunggu pembayaran", en: "Awaiting payment" },
  WAITING_VERIFICATION: { id: "Menunggu verifikasi", en: "Awaiting verification" },
  WAITING_VENDOR_CONFIRMATION: {
    id: "Menunggu konfirmasi vendor",
    en: "Awaiting vendor confirmation",
  },
  CONFIRMED: { id: "Dikonfirmasi", en: "Confirmed" },
  IN_PROGRESS: { id: "Sedang dikerjakan", en: "In progress" },
  WAITING_CUSTOMER_CONFIRMATION: {
    id: "Menunggu konfirmasi customer",
    en: "Awaiting customer confirmation",
  },
  COMPLETED: { id: "Selesai", en: "Completed" },
  CANCELLED: { id: "Dibatalkan", en: "Cancelled" },
  REJECTED_BY_VENDOR: { id: "Ditolak vendor", en: "Rejected by vendor" },
  DISPUTED: { id: "Dalam sengketa", en: "Disputed" },
  PAID: { id: "Lunas", en: "Paid" },
  FAILED: { id: "Gagal", en: "Failed" },
  EXPIRED: { id: "Kedaluwarsa", en: "Expired" },
  REFUNDED: { id: "Dikembalikan", en: "Refunded" },
};
