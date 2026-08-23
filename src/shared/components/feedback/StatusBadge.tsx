import { statusStyles } from "@/shared/config/status";
import { cn } from "@/shared/utils/cn";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  DRAFT: "Draft",
  INACTIVE: "Nonaktif",
  REJECTED: "Ditolak",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status] ?? "bg-stone-100 text-stone-700",
      )}
    >
      {STATUS_LABELS[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}
