"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { EmptyState } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
export function Reports() {
  const { translateText } = useTranslation();
  return (
    <FeaturePage
      title={translateText("Laporan")}
      description={translateText("Laporan operasional marketplace.")}
    >
      <EmptyState
        title={translateText("Laporan belum tersedia")}
        description={translateText(
          "Ringkasan pesanan dapat dilihat melalui Dashboard dan Monitoring Pesanan.",
        )}
      />
    </FeaturePage>
  );
}
export function AuditLogs() {
  const { translateText } = useTranslation();
  return (
    <FeaturePage
      title="Audit Log"
      description={translateText("Riwayat aktivitas penting di sistem.")}
    >
      <EmptyState
        title={translateText("Riwayat aktivitas belum tersedia")}
        description={translateText("Data audit belum tersedia untuk ditampilkan.")}
      />
    </FeaturePage>
  );
}
