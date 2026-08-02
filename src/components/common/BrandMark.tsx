import { APP_BRAND } from "@/constants/menu";
import { cn } from "@/utils/cn";

export function BrandMark({
  compact = false,
  dark = false,
  className,
}: {
  compact?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("group flex min-w-0 items-center gap-2.5", className)}>
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-gradient-to-br from-blush via-rose-400 to-champagne shadow-lg shadow-rose-200/50 transition group-hover:-rotate-3 group-hover:scale-105">
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          className="size-8 fill-none stroke-white"
          strokeWidth="1.8"
        >
          <path d="M9 15.5c0-4.2 5.5-6.2 8.5-2.7L20 15.7l2.5-2.9c3-3.5 8.5-1.5 8.5 2.7 0 6.1-6.2 10.3-11 15-4.8-4.7-11-8.9-11-15Z" />
          <path d="M13.5 9.5c2.3-2.4 5.8-2.4 8.1 0M18 7c2.2-1.6 5.2-1.1 6.8 1.1" />
        </svg>
        <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-white" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span
            className={cn("block truncate text-sm font-bold tracking-tight", dark && "text-white")}
          >
            {APP_BRAND.name}
          </span>
          <span
            className={cn(
              "block truncate text-[9px] uppercase tracking-[.18em]",
              dark ? "text-slate-400" : "text-stone-400",
            )}
          >
            {APP_BRAND.tagline}
          </span>
        </span>
      )}
    </div>
  );
}
