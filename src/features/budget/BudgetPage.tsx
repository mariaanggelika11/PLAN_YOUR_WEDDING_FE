"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";
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
  const { translateText, locale } = useTranslation();
  const resource = useAsyncResource(getBudgetSummary, { initialData: null });
  const data = resource.data;
  return (
    <FeaturePage
      title={translateText("Budget pernikahan")}
      description={translateText("Pantau anggaran dan pembayaran pesanan Anda.")}
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
                label={translateText("Anggaran pernikahan")}
                value={
                  !data.budgetSet
                    ? translateText("Belum diatur")
                    : formatCurrency(data.totalBudget, locale)
                }
              />
              <DashboardCard
                label={translateText("Nilai pesanan aktif / selesai")}
                value={formatCurrency(data.committedAmount, locale)}
              />
              <DashboardCard
                label={translateText("Sudah dibayar")}
                value={formatCurrency(data.verifiedPayments, locale)}
              />
              <DashboardCard
                label={translateText("Sisa anggaran")}
                value={
                  !data.budgetSet
                    ? translateText("Belum diatur")
                    : formatCurrency(data.remainingBudget, locale)
                }
              />
            </div>
            {data.overBudget && (
              <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                {translateText(
                  "Nilai pesanan melebihi anggaran. Tinjau kembali rencana pengeluaran Anda.",
                )}{" "}
              </p>
            )}
            <DashboardCard
              label={translateText("Sisa tagihan vendor")}
              value={formatCurrency(data.outstandingBills, locale)}
            />
            <p className="text-sm leading-6 text-stone-600">
              {translateText(
                "Sisa anggaran = total anggaran dikurangi nilai pesanan yang tidak batal/ditolak.",
              )}{" "}
            </p>
            <p className="text-sm leading-6 text-stone-600">
              {translateText(
                "Pembayaran dihitung setelah diverifikasi. Ringkasan ini belum mencakup pengeluaran di luar aplikasi atau pengembalian dana.",
              )}{" "}
            </p>
            <Link className="text-sm font-semibold text-blush" href={ROUTES.customer.profile}>
              {translateText("Atur anggaran di Profil Wedding")}{" "}
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
                formatCurrency(item.totalAmount, locale),
                formatCurrency(item.paidAmount, locale),
                formatCurrency(item.outstandingAmount, locale),
              ])}
            />
            <DataTable
              title={translateText("Ringkasan per kategori")}
              columns={["Kategori", "Pesanan", "Total", "Sudah dibayar", "Sisa tagihan"]}
              rows={data.byCategory.map((item) => [
                item.category,
                item.orderCount,
                formatCurrency(item.totalAmount, locale),
                formatCurrency(item.paidAmount, locale),
                formatCurrency(item.outstandingAmount, locale),
              ])}
            />
          </>
        )
      )}
    </FeaturePage>
  );
}
