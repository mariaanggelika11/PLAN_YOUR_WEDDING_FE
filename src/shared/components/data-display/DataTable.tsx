"use client";

import { AppButton } from "@/shared/components/ui/AppButton";
import { AppIconButton } from "@/shared/components/ui/AppIconButton";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

interface DataTableProps {
  columns: string[];
  rows: ReactNode[][];
  title?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  itemLabel?: string;
  showToolbar?: boolean;
  showPagination?: boolean;
}
export function DataTable({
  columns,
  rows,
  title,
  total = rows.length,
  page = 1,
  pageSize = Math.max(rows.length, 1),
  searchValue,
  onSearchChange,
  onPageChange,
  itemLabel = "data",
  showToolbar = Boolean(onSearchChange),
  showPagination = false,
}: DataTableProps) {
  const { t, translateText } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">
            {title ? translateText(title) : t("table.defaultTitle")}
          </h3>
          <p className="text-xs text-stone-400">
            {t("table.resultCount", { total, item: translateText(itemLabel) })}
          </p>
        </div>
        {showToolbar && (
          <div className="flex min-w-0 gap-2">
            <label className="flex flex-1 items-center gap-2 min-w-0 rounded-lg border bg-white px-3 py-2.5 text-stone-500 focus-within:border-blush">
              <Search size={15} />
              <input
                aria-label={t("table.search")}
                className="w-full min-w-0 bg-transparent text-sm text-ink outline-none"
                placeholder={t("table.searchPlaceholder")}
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </label>
            <AppButton aria-label={t("table.filter")} variant="secondary" className="min-h-9 px-3">
              <SlidersHorizontal size={15} />
            </AppButton>
          </div>
        )}
      </div>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[720px] text-left text-sm tabular-nums">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 text-xs font-medium" key={column}>
                  {translateText(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr
                  className="border-t border-stone-100 transition-colors hover:bg-stone-50/70"
                  key={rowIndex}
                >
                  {row.map((cell, cellIndex) => (
                    <td className="px-4 py-4 align-middle text-stone-700" key={cellIndex}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t">
                <td className="px-4 py-12 text-center text-stone-500" colSpan={columns.length}>
                  {t("table.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(showPagination || totalPages > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-stone-500">
          <span aria-live="polite" className="tabular-nums">
            {t("pagination.summary", { page, totalPages })}
          </span>
          <div className="flex gap-1">
            <AppIconButton
              className="size-9 rounded-lg"
              disabled={page <= 1}
              label={t("pagination.previous")}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft size={15} />
            </AppIconButton>
            <AppIconButton
              className="size-9 rounded-lg"
              disabled={page >= totalPages}
              label={t("pagination.next")}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight size={15} />
            </AppIconButton>
          </div>
        </div>
      )}
    </section>
  );
}
