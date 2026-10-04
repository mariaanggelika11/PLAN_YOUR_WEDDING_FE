"use client";
import { useCallback } from "react";
import Link from "next/link";
import { getDashboardSummary, type DashboardSummary } from "./api";
import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";

function dashboardCards(data: DashboardSummary): Array<[string, string | number]> {
  if (data.role === "customer")
    return [
      ["Pesanan aktif", data.orders.active ?? 0],
      ["Pembayaran perlu aksi", data.payments.needAction],
      ["Menunggu verifikasi", data.payments.waitingVerification],
      ["Vendor dipesan", data.vendorsBooked],
      [
        "Sisa anggaran",
        data.budget.budgetSet ? formatCurrency(data.budget.remainingBudget) : "Belum diatur",
      ],
      ["Persiapan selesai", `${data.tasks.progressPercent}%`],
    ];
  if (data.role === "vendor")
    return [
      ["Total paket", data.products.total],
      ["Paket aktif", data.products.active],
      ["Pesanan masuk", data.orders.incoming ?? 0],
      ["Pesanan selesai", data.orders.completed ?? 0],
      ["Bukti perlu diperiksa", data.paymentsToVerify],
      ["Pendapatan bulan ini", formatCurrency(data.revenue.thisMonth)],
      ["Total pendapatan", formatCurrency(data.revenue.total)],
      [
        "Rating toko",
        data.rating.count
          ? `${Number(data.rating.average).toFixed(1)} · ${data.rating.count} ulasan`
          : "Belum ada ulasan",
      ],
    ];
  return [
    ["Total pengguna", data.users.total],
    ["Total vendor", data.vendors.total],
    ["Vendor menunggu verifikasi", data.vendors.pendingVerification],
    ["Pembayaran pending", data.paymentsPending],
    ["Pesanan aktif", data.orders.active ?? 0],
    ["Sengketa terbuka", data.openDisputes],
    ["Total pembayaran terverifikasi", formatCurrency(data.revenue)],
  ];
}
export function OrderDashboard({ role }: { role: "customer" | "vendor" | "admin" }) {
  const loader = useCallback(() => getDashboardSummary(role), [role]);
  const resource = useAsyncResource(loader, { initialData: null });
  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error)
    return <ErrorState description={resource.error} retry={() => void resource.reload()} />;
  if (!resource.data) return null;
  const cards = dashboardCards(resource.data);
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <DashboardCard key={label} label={label} value={value} />
        ))}
      </div>
      <DataTable
        title="Ringkasan pesanan"
        columns={["Nomor", role === "vendor" ? "Customer" : "Vendor", "Total", "Status"]}
        rows={resource.data.recentOrders.map((order) => [
          <Link
            key={order.id}
            className="font-semibold text-blush"
            href={role === "admin" ? `/admin/orders/${order.id}` : ROUTES[role].order(order.id)}
          >
            {order.orderNumber}
          </Link>,
          role === "vendor" ? order.customer.fullName : order.vendor.businessName,
          formatCurrency(order.totalAmount),
          <StatusBadge key="status" status={order.status} />,
        ])}
      />
      <Link href={ROUTES[role].orders} className="text-sm font-semibold text-blush">
        Lihat semua pesanan
      </Link>
    </div>
  );
}
