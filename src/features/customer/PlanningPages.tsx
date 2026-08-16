import { notificationRepository } from "@/features/notifications/repository";
import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <FeaturePage title={title} description={description} showHeader={false}>
      {children}
    </FeaturePage>
  );
}

export function ProgressPage() {
  return (
    <Page title="Wedding Progress" description="Pantau tugas penting menjelang hari pernikahan.">
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard label="Progress" value="68%" />
        <DashboardCard label="Selesai" value="17 tugas" />
        <DashboardCard label="Pending" value="7 tugas" />
        <DashboardCard label="Terlambat" value="1 tugas" />
      </div>
      <DataTable
        columns={["Tugas", "Kategori", "Tenggat", "Status"]}
        rows={[
          [
            "Finalisasi menu catering",
            "Catering",
            "20 Juni 2026",
            <StatusBadge status="IN_PROGRESS" />,
          ],
          ["Konfirmasi dekorasi", "Decoration", "1 Juli 2026", <StatusBadge status="COMPLETED" />],
        ]}
      />
    </Page>
  );
}
export function BudgetPage() {
  return (
    <Page title="Budget Management" description="Bandingkan rencana dan realisasi biaya wedding.">
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard label="Total budget" value={formatCurrency(250000000)} />
        <DashboardCard label="Rencana" value={formatCurrency(210000000)} />
        <DashboardCard label="Aktual" value={formatCurrency(168000000)} />
        <DashboardCard label="Sisa" value={formatCurrency(82000000)} />
      </div>
      <DataTable
        columns={["Kategori", "Rencana", "Aktual", "Terkait pesanan"]}
        rows={[
          ["Decoration", formatCurrency(50000000), formatCurrency(45000000), "PYW-260601"],
          ["Catering", formatCurrency(90000000), formatCurrency(85000000), "PYW-260602"],
        ]}
      />
    </Page>
  );
}
export function NotificationPage() {
  /* TODO API: Ambil daftar notifikasi user dan tandai notifikasi sebagai read */ return (
    <Page title="Notifikasi" description="Pembaruan penting mengenai booking dan pembayaran.">
      <div className="grid gap-3">
        {notificationRepository.list().map((n) => (
          <article className="flex gap-4 rounded-3xl border bg-white p-5 shadow-sm" key={n.id}>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-50 text-blush">
              <Sparkles size={18} />
            </span>
            <div>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{n.message}</p>
              <button className="mt-2 text-xs font-semibold text-blush">Tandai sudah dibaca</button>
            </div>
          </article>
        ))}
      </div>
    </Page>
  );
}
