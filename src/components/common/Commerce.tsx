import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

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
export function OrderTimeline({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-4">
      {items.map((item, index) => (
        <li className="flex gap-3 text-sm" key={item}>
          <CheckCircle2
            className={index === items.length - 1 ? "text-stone-300" : "text-emerald-600"}
            size={18}
          />
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
