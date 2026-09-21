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
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-cream">
        <Image
          alt=""
          aria-hidden="true"
          className="size-11 scale-125 object-contain"
          height={40}
          priority
          src={APP_BRAND.logo}
          width={40}
        />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate text-sm font-semibold tracking-tight",
              dark && "text-white",
            )}
          >
            {APP_BRAND.name}
          </span>
          <span
            className={cn(
              "block truncate text-[9px] uppercase tracking-[.18em]",
              dark ? "text-slate-400" : "text-stone-500",
            )}
          >
            {APP_BRAND.tagline}
          </span>
        </span>
      )}
    </div>
  );
}
