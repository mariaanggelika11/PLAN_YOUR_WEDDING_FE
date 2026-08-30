import { MarketplaceExplorer } from "@/features/marketplace/MarketplaceExplorer";
import { CustomerProfileForm } from "@/features/profile/components/customer/CustomerProfileForm";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import type { ReactNode } from "react";

import { CustomerDashboard } from "@/features/customer/DashboardPage";
import {
  CheckoutPage,
  PaymentPage,
  ProductDetail,
  VendorDetail,
} from "@/features/customer/MarketplacePages";
import { OrderDetail, Orders, ReviewPage } from "@/features/customer/OrderPages";
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
  if (page === "products" && slug[1]) return <ProductDetail productId={slug[1]} />;
  if (page === "checkout" && slug[1]) return <CheckoutPage productId={slug[1]} />;
  if (page === "payment" && slug[1]) return <PaymentPage orderId={slug[1]} />;
  if (page === "orders" && slug[1]) return <OrderDetail orderId={slug[1]} />;
  if (page === "orders") return <Orders />;
  if (page === "review" && slug[1]) return <ReviewPage orderId={slug[1]} />;
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
