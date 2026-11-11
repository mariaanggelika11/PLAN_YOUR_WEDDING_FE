"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";
import Link from "next/link";
import { OrderDashboard } from "@/features/dashboard/OrderDashboard";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
export function AdminDashboard() {
  const { translateText } = useTranslation();
  return (
    <FeaturePage
      title="Admin Dashboard"
      description={translateText("Ringkasan operasional Plan Your Wedding.")}
    >
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-blush">
        <Link href="/admin/vendor-verification">{translateText("Periksa verifikasi vendor")}</Link>
        <Link href="/admin/payment-verification">{translateText("Periksa pembayaran")}</Link>
      </div>
      <OrderDashboard role="admin" />
    </FeaturePage>
  );
}
