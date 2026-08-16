import { statusStyles } from "@/shared/config/status";
import { cn } from "@/shared/utils/cn";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status] ?? "bg-stone-100 text-stone-700",
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
