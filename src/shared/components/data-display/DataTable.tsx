"use client";

import { AppButton } from "@/shared/components/ui/AppButton";
import { AppIconButton } from "@/shared/components/ui/AppIconButton";
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
  title = "Daftar data",
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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-stone-400">
            {total} {itemLabel} ditemukan
          </p>
        </div>
        {showToolbar && (
          <div className="flex gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-xl border bg-stone-50 px-3 py-2 text-stone-400">
              <Search size={15} />
              <input
                aria-label="Cari data"
                className="w-full bg-transparent text-xs outline-none"
                placeholder="Cari data..."
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </label>
            <AppButton aria-label="Filter data" variant="secondary" className="min-h-9 px-3">
              <SlidersHorizontal size={15} />
            </AppButton>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-stone-50/95 text-stone-500 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  key={column}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr className="border-t transition hover:bg-rose-50/40" key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td className="px-4 py-4" key={cellIndex}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t">
                <td className="px-4 py-12 text-center text-stone-500" colSpan={columns.length}>
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(showPagination || totalPages > 1) && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-stone-500">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-1">
            <AppIconButton
              className="size-8 rounded-lg"
              disabled={page <= 1}
              label="Halaman sebelumnya"
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft size={15} />
            </AppIconButton>
            <AppIconButton
              className="size-8 rounded-lg"
              disabled={page >= totalPages}
              label="Halaman berikutnya"
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
