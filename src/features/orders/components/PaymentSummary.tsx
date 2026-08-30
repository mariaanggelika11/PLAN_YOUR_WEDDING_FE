import type { Order, OrderPayment } from "@/features/orders/types";
import { formatCurrency } from "@/shared/utils/formatCurrency";

export function getPaymentSummary(order: Pick<Order, "totalAmount" | "payments">) {
  const payments = order.payments ?? [];
  const paidAmount = sumPayments(payments, ["PAID"]);
  const pendingVerificationAmount = sumPayments(payments, ["WAITING_VERIFICATION"]);
  return {
    paidAmount,
    pendingVerificationAmount,
    remainingAmount: Math.max(order.totalAmount - paidAmount, 0),
    isFullyPaid: paidAmount >= order.totalAmount,
  };
}

function sumPayments(payments: OrderPayment[], statuses: OrderPayment["status"][]) {
  return payments
    .filter((payment) => statuses.includes(payment.status))
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
}

export function PaymentSummary({ order }: { order: Pick<Order, "totalAmount" | "payments"> }) {
  const summary = getPaymentSummary(order);
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Ringkasan pembayaran</h2>
          <p className="mt-1 text-sm text-stone-500">Hanya pembayaran berstatus PAID yang dihitung sebagai dana masuk.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${summary.isFullyPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
          {summary.isFullyPaid ? "LUNAS" : "BELUM LUNAS"}
        </span>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PaymentAmount label="Total pesanan" value={order.totalAmount} />
        <PaymentAmount label="Dana sudah masuk" value={summary.paidAmount} />
        <PaymentAmount label="Sedang diverifikasi" value={summary.pendingVerificationAmount} />
        <PaymentAmount emphasize label="Sisa tagihan" value={summary.remainingAmount} />
      </dl>
      {!summary.isFullyPaid && (
        <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Pesanan belum dapat diselesaikan karena masih ada sisa tagihan {formatCurrency(summary.remainingAmount)}.
        </p>
      )}
    </section>
  );
}

function PaymentAmount({ emphasize, label, value }: { emphasize?: boolean; label: string; value: number }) {
  return (
    <div className={`rounded-2xl p-4 ${emphasize ? "bg-rose-50" : "bg-stone-50"}`}>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className={`mt-1 font-semibold ${emphasize ? "text-blush" : "text-ink"}`}>{formatCurrency(value)}</dd>
    </div>
  );
}
