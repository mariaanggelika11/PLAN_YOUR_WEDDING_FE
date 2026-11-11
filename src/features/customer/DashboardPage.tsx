"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { CustomerDashboardProfile } from "./CustomerDashboardProfile";
import { OrderDashboard } from "@/features/dashboard/OrderDashboard";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import Link from "next/link";

export function CustomerDashboard() {
  const { t, translateText } = useTranslation();
  return (
    <FeaturePage
      title={translateText("Dashboard Wedding")}
      description={translateText("Ringkasan pesanan dan persiapan pernikahan Anda.")}
      showHeader={false}
    >
      <CustomerDashboardProfile />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["customerDashboard.findVendors", "/customer/marketplace"],
            ["customerDashboard.myOrders", "/customer/orders"],
            ["customerDashboard.weddingPreparations", "/customer/progress"],
            ["customerDashboard.viewBudget", "/customer/budget"],
          ] as const
        ).map(([labelKey, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border bg-white p-4 text-sm font-semibold hover:text-blush"
          >
            {t(labelKey)}
          </Link>
        ))}
      </div>
      <OrderDashboard role="customer" />
    </FeaturePage>
  );
}
