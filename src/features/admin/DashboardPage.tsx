import { mockAdminSummary } from "@/mocks/mockData";
import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { PlaceholderPanel } from "@/shared/components/data-display/DetailBlocks";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import Link from "next/link";

export function AdminDashboard() {
  const s = mockAdminSummary;
  /* TODO API: Ambil ringkasan dashboard admin dari backend */ return (
    <Page title="Admin Dashboard" description="Ringkasan operasional Plan Your Wedding.">
      <section className="rounded-[2rem] bg-gradient-to-r from-[#101828] to-slate-700 p-7 text-white shadow-2xl">
        <p className="text-sm text-slate-300">Marketplace health</p>
        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold">Semua sistem berjalan normal</h2>
            <p className="mt-2 text-sm text-slate-300">
              18 vendor dan 27 pembayaran membutuhkan perhatian.
            </p>
          </div>
          <AppButton asChild>
            <Link href={ROUTES.admin.vendors}>Buka antrean verifikasi</Link>
          </AppButton>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total pengguna" value={s.totalUsers} />
        <DashboardCard label="Total vendor" value={s.totalVendors} />
        <DashboardCard label="Vendor pending" value={s.pendingVendors} />
        <DashboardCard label="Pembayaran pending" value={s.pendingPayments} />
        <DashboardCard label="Total pesanan" value={s.totalOrders} />
        <DashboardCard label="Sengketa terbuka" value={s.openDisputes} />
        <DashboardCard label="Revenue" value={formatCurrency(s.revenue)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderPanel
          title="Revenue & order trend"
          description="Visualisasi performa marketplace per periode."
        />
        <DataTable
          title="Aktivitas terbaru"
          columns={["Aksi", "Entity", "Waktu"]}
          rows={[
            ["Vendor disetujui", "Atelier Aurora", "10 menit lalu"],
            ["Pembayaran diverifikasi", "PYW-260602", "22 menit lalu"],
            ["Sengketa dibuka", "D-1004", "1 jam lalu"],
          ]}
        />
      </div>
    </Page>
  );
}
