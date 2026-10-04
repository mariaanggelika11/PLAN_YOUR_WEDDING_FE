"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import { paginationPages } from "./paginationPages";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  className,
  label = "Pagination",
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const { t, locale } = useTranslation();
  const total = Math.max(1, totalPages);
  const button =
    "flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-sm tabular-nums transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush disabled:cursor-default disabled:opacity-40 sm:h-9 sm:min-w-9";
  return (
    <nav
      aria-label={label}
      className={cn("flex flex-wrap items-center justify-center gap-0.5", className)}
    >
      <button
        type="button"
        className={button}
        aria-label={t("pagination.previous")}
        title={t("pagination.previous")}
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>
      {paginationPages(page, total).map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="w-4 text-center text-sm text-stone-400"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`${locale === "en" ? "Page" : "Halaman"} ${item}`}
            aria-current={item === page ? "page" : undefined}
            disabled={disabled}
            className={cn(
              button,
              item === page && "bg-blush font-semibold text-white hover:bg-blush",
            )}
            onClick={() => {
              if (item !== page) onPageChange(item);
            }}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className={button}
        aria-label={t("pagination.next")}
        title={t("pagination.next")}
        disabled={disabled || page >= total}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  );
}
