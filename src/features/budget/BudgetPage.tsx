"use client";
import Link from "next/link";
import { getBudgetSummary } from "./api";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { ROUTES } from "@/shared/config/routes";

export function BudgetPage() {
  const resource = useAsyncResource(getBudgetSummary, { initialData: null });
  const data = resource.data;
  return (
    <FeaturePage
      title="Budget pernikahan"
      description="Pantau anggaran dan pembayaran pesanan Anda."
      showHeader={false}
    >
      {resource.loading ? (
        <LoadingSkeleton />
      ) : resource.error ? (
        <ErrorState description={resource.error} retry={() => void resource.reload()} />
      ) : (
        data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                label="Anggaran pernikahan"
                value={!data.budgetSet ? "Belum diatur" : formatCurrency(data.totalBudget)}
              />
              <DashboardCard
                label="Nilai pesanan aktif / selesai"
                value={formatCurrency(data.committedAmount)}
              />
              <DashboardCard label="Sudah dibayar" value={formatCurrency(data.verifiedPayments)} />
              <DashboardCard
                label="Sisa anggaran"
                value={!data.budgetSet ? "Belum diatur" : formatCurrency(data.remainingBudget)}
              />
            </div>
            {data.overBudget && (
              <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                Nilai pesanan melebihi anggaran. Tinjau kembali rencana pengeluaran Anda.
              </p>
            )}
            <DashboardCard
              label="Sisa tagihan vendor"
              value={formatCurrency(data.outstandingBills)}
            />
            <p className="text-sm leading-6 text-stone-500">
              Sisa anggaran = total anggaran dikurangi nilai pesanan yang tidak batal/ditolak.
            </p>
            <p className="text-sm leading-6 text-stone-500">
              Pembayaran dihitung setelah diverifikasi. Ringkasan ini belum mencakup pengeluaran di
              luar aplikasi atau pengembalian dana.
            </p>
            <Link className="text-sm font-semibold text-blush" href={ROUTES.customer.profile}>
              Atur anggaran di Profil Wedding
            </Link>
            <DataTable
              columns={["Pesanan", "Vendor", "Total", "Sudah dibayar", "Sisa tagihan"]}
              rows={data.items.map((item) => [
                <Link
                  key={item.orderId}
                  href={ROUTES.customer.order(item.orderId)}
                  className="text-blush"
                >
                  {item.orderNumber}
                </Link>,
                item.vendorName,
                formatCurrency(item.totalAmount),
                formatCurrency(item.paidAmount),
                formatCurrency(item.outstandingAmount),
              ])}
            />
            <DataTable
              title="Ringkasan per kategori"
              columns={["Kategori", "Pesanan", "Total", "Sudah dibayar", "Sisa tagihan"]}
              rows={data.byCategory.map((item) => [
                item.category,
                item.orderCount,
                formatCurrency(item.totalAmount),
                formatCurrency(item.paidAmount),
                formatCurrency(item.outstandingAmount),
              ])}
            />
          </>
        )
      )}
    </FeaturePage>
  );
}
