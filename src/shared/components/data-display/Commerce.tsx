import { formatCurrency } from "@/shared/utils/formatCurrency";
import { CheckCircle2 } from "lucide-react";

export function PriceBreakdown({ subtotal, fee = 0 }: { subtotal: number; fee?: number }) {
  return (
    <div className="grid gap-3 rounded-2xl border bg-white p-5 text-sm">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Biaya layanan</span>
        <span>{formatCurrency(fee)}</span>
      </div>
      <div className="flex justify-between border-t pt-3 text-base font-semibold">
        <span>Total</span>
        <span>{formatCurrency(subtotal + fee)}</span>
      </div>
    </div>
  );
}
export interface OrderTimelineItem {
  label: string;
  date?: string | null;
}

export function OrderTimeline({ items }: { items: Array<string | OrderTimelineItem> }) {
  return (
    <ol className="grid gap-4">
      {items.map((item, index) => {
        const entry = typeof item === "string" ? { label: item, date: undefined } : item;
        return (
        <li className="flex gap-3 text-sm" key={`${entry.label}-${entry.date ?? index}`}>
          <CheckCircle2
            className={index === items.length - 1 ? "text-stone-300" : "text-emerald-600"}
            size={18}
          />
          <span>
            <span className="block font-medium text-ink">{entry.label}</span>
            <span className="mt-0.5 block text-xs text-stone-400">
              {entry.date ?? "Waktu belum tersedia"}
            </span>
          </span>
        </li>
      )})}
    </ol>
  );
}
