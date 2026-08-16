import { MarketplaceExplorer } from "@/features/marketplace/MarketplaceExplorer";
import { CustomerProfileForm } from "@/features/profile/components/customer/CustomerProfileForm";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { EntityForm } from "@/shared/components/forms/EntityForm";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import type { ReactNode } from "react";

import { CustomerDashboard } from "@/features/customer/DashboardPage";
import {
  CheckoutPage,
  PaymentPage,
  ProductDetail,
  VendorDetail,
} from "@/features/customer/MarketplacePages";
import { OrderDetail, Orders } from "@/features/customer/OrderPages";
import { BudgetPage, NotificationPage, ProgressPage } from "@/features/customer/PlanningPages";

export function CustomerPage({ slug }: { slug: string[] }) {
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request
  if (page === "dashboard") return <CustomerDashboard />;
  if (page === "profile")
    return (
      <Page title="Profil Wedding" description="Kelola informasi profile customer Anda.">
        <CustomerProfileForm />
      </Page>
    );
  if (page === "marketplace")
    return (
      <Page
        title="Marketplace Vendor"
        description="Temukan vendor yang sesuai dengan kebutuhan dan budget Anda."
      >
        <MarketplaceExplorer />
        <div className="hidden">
          <LoadingSkeleton />
          <ErrorState />
        </div>
      </Page>
    );
  if (page === "vendors") return <VendorDetail />;
  if (page === "products") return <ProductDetail />;
  if (page === "checkout") return <CheckoutPage />;
  if (page === "payment") return <PaymentPage />;
  if (page === "orders" && slug[1]) return <OrderDetail />;
  if (page === "orders") return <Orders />;
  if (page === "review")
    return (
      <Page title="Beri Ulasan" description="Bagikan pengalaman Anda setelah pesanan selesai.">
        <EntityForm
          fields={[
            {
              label: "Rating (1-5)",
              name: "rating",
              type: "number",
              min: 1,
              max: 5,
              required: true,
            },
            { label: "Komentar ulasan", name: "comment", type: "textarea", required: true },
            { label: "Foto ulasan (opsional)", name: "image", type: "file" },
          ]}
          submitLabel="Kirim ulasan"
        />
      </Page>
    );
  if (page === "progress") return <ProgressPage />;
  if (page === "budget") return <BudgetPage />;
  if (page === "notifications") return <NotificationPage />;
  return <EmptyState title="Halaman tidak ditemukan" />;
}

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
