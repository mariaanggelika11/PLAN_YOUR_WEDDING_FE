"use client";

import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { type ReactNode } from "react";

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

export { ProgressPage } from "@/features/planning/ProgressPage";

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
export { NotificationPage } from "@/features/notifications/NotificationPage";
