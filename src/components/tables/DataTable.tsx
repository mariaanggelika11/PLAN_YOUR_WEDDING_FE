import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";

interface DataTableProps {
  columns: string[];
  rows: ReactNode[][];
  title?: string;
}
export function DataTable({ columns, rows, title = "Daftar data" }: DataTableProps) {
  // TODO API: Ambil data table dari backend dengan pagination dan filter
  return (
    <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-stone-400">{rows.length} data ditampilkan</p>
        </div>
        <div className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-xl border bg-stone-50 px-3 py-2 text-stone-400">
            <Search size={15} />
            <input
              aria-label="Cari data"
              className="w-full bg-transparent text-xs outline-none"
              placeholder="Cari data..."
            />
          </label>
          <AppButton aria-label="Filter data" variant="secondary" className="min-h-9 px-3">
            <SlidersHorizontal size={15} />
          </AppButton>
        </div>
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
            {rows.map((row, rowIndex) => (
              <tr className="border-t transition hover:bg-rose-50/40" key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-4" key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-stone-500">
        <span>Halaman 1 dari 1</span>
        <div className="flex gap-1">
          <button
            aria-label="Halaman sebelumnya"
            className="grid size-8 place-items-center rounded-lg border disabled:opacity-40"
            disabled
          >
            <ChevronLeft size={15} />
          </button>
          <button
            aria-label="Halaman berikutnya"
            className="grid size-8 place-items-center rounded-lg border disabled:opacity-40"
            disabled
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
