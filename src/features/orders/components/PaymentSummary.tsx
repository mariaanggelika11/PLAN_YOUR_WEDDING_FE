export { getPaymentSummary } from "@/features/orders/rules";
import type { Order, OrderPayment } from "@/features/orders/types";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import {
  getPaymentSummary,
  paymentInstallmentLabel,
  sortPaymentsByInstallment,
} from "@/features/orders/rules";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";

export function PaymentSummary({
  order,
}: {
  order: Pick<Order, "totalAmount" | "payments" | "paidAmount" | "outstandingAmount">;
}) {
  const summary = getPaymentSummary(order);
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Ringkasan pembayaran</h2>
          <p className="mt-1 text-sm text-stone-500">
            Hanya pembayaran berstatus PAID yang dihitung sebagai dana masuk.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${summary.isFullyPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
        >
          {summary.isFullyPaid ? "LUNAS" : "BELUM LUNAS"}
        </span>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <PaymentAmount label="Total pesanan" value={order.totalAmount} />
        <PaymentAmount label="Dana sudah masuk" value={summary.paidAmount} />
        <PaymentAmount label="Sedang diverifikasi" value={summary.pendingVerificationAmount} />
        <PaymentAmount emphasize label="Sisa tagihan" value={summary.remainingAmount} />
      </dl>
      {!summary.isFullyPaid && (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Pesanan belum dapat diselesaikan karena masih ada sisa tagihan{" "}
          {formatCurrency(summary.remainingAmount)}.
        </p>
      )}
      {!!order.payments?.length && (
        <div className="mt-5 overflow-hidden rounded-xl border">
          {sortPaymentsByInstallment(order.payments).map((payment) => (
            <div
              className="grid min-w-0 gap-2 border-b p-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              key={payment.id}
            >
              <div>
                <p className="font-semibold text-ink">
                  {paymentInstallmentLabel(payment.installment)}
                </p>
                <p className="text-xs text-stone-500">Tagihan {formatCurrency(payment.amount)}</p>
              </div>
              <StatusBadge status={payment.status} />
              <p className="text-xs text-stone-500 sm:text-right">
                {paymentStatusDescription(payment)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function PaymentStagesCompact({ payments }: { payments?: OrderPayment[] }) {
  if (!payments?.length) return <span className="text-stone-400">Belum tersedia</span>;
  return (
    <div className="grid min-w-36 gap-2">
      {sortPaymentsByInstallment(payments).map((payment) => (
        <div className="flex items-center justify-between gap-2" key={payment.id}>
          <span className="whitespace-nowrap text-xs font-semibold text-stone-600">
            {paymentInstallmentLabel(payment.installment)}
          </span>
          <StatusBadge status={payment.status} />
        </div>
      ))}
    </div>
  );
}

function paymentStatusDescription(payment: OrderPayment) {
  if (payment.status === "WAITING_VERIFICATION") return "Menunggu verifikasi vendor";
  if (payment.status === "WAITING_PAYMENT") return "Menunggu bukti dari customer";
  if (payment.status === "REJECTED") return "Ditolak vendor — upload ulang diperlukan";
  if (payment.status === "PAID") return "Sudah diverifikasi vendor";
  return payment.status;
}

function PaymentAmount({
  emphasize,
  label,
  value,
}: {
  emphasize?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className={`rounded-xl p-4 ${emphasize ? "bg-rose-50" : "bg-stone-50"}`}>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className={`mt-1 font-semibold ${emphasize ? "text-blush" : "text-ink"}`}>
        {formatCurrency(value)}
      </dd>
    </div>
  );
}
