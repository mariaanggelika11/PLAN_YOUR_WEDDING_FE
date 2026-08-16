import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { PlaceholderPanel } from "@/shared/components/data-display/DetailBlocks";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { formatCurrency } from "@/shared/utils/formatCurrency";

export function Reports() {
  return (
    <Page title="Report Overview" description="Tren bisnis dan performa marketplace.">
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard label="Revenue bulan ini" value={formatCurrency(840000000)} />
        <DashboardCard label="Kategori populer" value="Catering" />
        <DashboardCard label="Top vendor" value="Atelier Aurora" />
      </div>
      <PlaceholderPanel
        title="Tren pesanan"
        description="Placeholder visualisasi order dan revenue."
      />
    </Page>
  );
}
export function AuditLogs() {
  return (
    <Page title="Audit Log" description="Riwayat aktivitas penting di sistem.">
      <DataTable
        columns={["Aksi", "User", "Entity", "Entity ID", "Timestamp", "IP Address"]}
        rows={[
          ["APPROVE_VENDOR", "Admin PYW", "Vendor", "v3", "7 Juni 2026, 10.30", "192.0.2.xxx"],
          ["VERIFY_PAYMENT", "Admin PYW", "Payment", "pay1", "7 Juni 2026, 09.15", "192.0.2.xxx"],
        ]}
      />
    </Page>
  );
}
