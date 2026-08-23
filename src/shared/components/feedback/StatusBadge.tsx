"use client";

import { statusStyles } from "@/shared/config/status";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
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
      {statusLabels[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}
