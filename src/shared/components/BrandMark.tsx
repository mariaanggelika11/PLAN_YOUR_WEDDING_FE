import { APP_BRAND } from "@/shared/config/navigation";
import { cn } from "@/shared/utils/cn";
import Image from "next/image";

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
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-white shadow-md shadow-rose-200/40 ring-1 ring-rose-100 transition group-hover:-rotate-3 group-hover:scale-105">
        <Image
          alt=""
          aria-hidden="true"
          className="size-10 object-contain p-0.5"
          height={40}
          priority
          src={APP_BRAND.logo}
          width={40}
        />
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
