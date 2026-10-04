import { EmptyState } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
export function Reports() {
  return (
    <FeaturePage title="Laporan" description="Laporan operasional marketplace.">
      <EmptyState
        title="Laporan belum tersedia"
        description="Ringkasan pesanan dapat dilihat melalui Dashboard dan Monitoring Pesanan."
      />
    </FeaturePage>
  );
}
export function AuditLogs() {
  return (
    <FeaturePage title="Audit Log" description="Riwayat aktivitas penting di sistem.">
      <EmptyState
        title="Riwayat aktivitas belum tersedia"
        description="Data audit belum tersedia untuk ditampilkan."
      />
    </FeaturePage>
  );
}
