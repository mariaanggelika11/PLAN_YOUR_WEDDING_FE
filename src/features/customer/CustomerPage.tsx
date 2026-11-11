"use client";
import dynamic from "next/dynamic";

import { useTranslation } from "@/shared/i18n/useTranslation";

import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import type { ReactNode } from "react";

const StorePage = dynamic(
  () => import("@/features/marketplace/StorePage").then((module) => module.StorePage),
  { loading: () => <LoadingSkeleton /> },
);
const MarketplaceExplorer = dynamic(
  () =>
    import("@/features/marketplace/MarketplaceExplorer").then(
      (module) => module.MarketplaceExplorer,
    ),
  { loading: () => <LoadingSkeleton /> },
);
const CustomerProfileForm = dynamic(
  () =>
    import("@/features/profile/components/customer/CustomerProfileForm").then(
      (module) => module.CustomerProfileForm,
    ),
  { loading: () => <LoadingSkeleton /> },
);
const CustomerDashboard = dynamic(
  () => import("@/features/customer/DashboardPage").then((module) => module.CustomerDashboard),
  { loading: () => <LoadingSkeleton /> },
);
const CheckoutPage = dynamic(
  () => import("@/features/customer/MarketplacePages").then((module) => module.CheckoutPage),
  { loading: () => <LoadingSkeleton /> },
);
const PaymentPage = dynamic(
  () => import("@/features/customer/MarketplacePages").then((module) => module.PaymentPage),
  { loading: () => <LoadingSkeleton /> },
);
const ProductDetail = dynamic(
  () => import("@/features/customer/MarketplacePages").then((module) => module.ProductDetail),
  { loading: () => <LoadingSkeleton /> },
);
const OrderDetail = dynamic(
  () => import("@/features/customer/OrderPages").then((module) => module.OrderDetail),
  { loading: () => <LoadingSkeleton /> },
);
const Orders = dynamic(
  () => import("@/features/customer/OrderPages").then((module) => module.Orders),
  { loading: () => <LoadingSkeleton /> },
);
const ReviewPage = dynamic(
  () => import("@/features/customer/OrderPages").then((module) => module.ReviewPage),
  { loading: () => <LoadingSkeleton /> },
);
const BudgetPage = dynamic(
  () => import("@/features/budget/BudgetPage").then((module) => module.BudgetPage),
  { loading: () => <LoadingSkeleton /> },
);
const NotificationPage = dynamic(
  () =>
    import("@/features/notifications/NotificationPage").then((module) => module.NotificationPage),
  { loading: () => <LoadingSkeleton /> },
);
const ProgressPage = dynamic(
  () => import("@/features/planning/ProgressPage").then((module) => module.ProgressPage),
  { loading: () => <LoadingSkeleton /> },
);

export function CustomerPage({ slug }: { slug: string[] }) {
  const { translateText } = useTranslation();
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request
  if (page === "dashboard") return <CustomerDashboard />;
  if (page === "profile")
    return (
      <Page
        title={translateText("Profil Wedding")}
        description={translateText("Kelola informasi profile customer Anda.")}
      >
        <CustomerProfileForm />
      </Page>
    );
  if (page === "marketplace")
    return (
      <Page
        title={translateText("Marketplace Vendor")}
        description={translateText("Temukan vendor yang sesuai dengan kebutuhan dan budget Anda.")}
      >
        <MarketplaceExplorer />
        <div className="hidden">
          <LoadingSkeleton />
          <ErrorState />
        </div>
      </Page>
    );
  if (page === "vendors" && slug[1]) return <StorePage key={slug[1]} vendorId={slug[1]} />;
  if (page === "products" && slug[1]) return <ProductDetail key={slug[1]} productId={slug[1]} />;
  if (page === "checkout" && slug[1]) return <CheckoutPage productId={slug[1]} />;
  if (page === "payment" && slug[1]) return <PaymentPage orderId={slug[1]} />;
  if (page === "orders" && slug[1]) return <OrderDetail orderId={slug[1]} />;
  if (page === "orders") return <Orders />;
  if (page === "review" && slug[1]) return <ReviewPage orderId={slug[1]} />;
  if (page === "progress") return <ProgressPage />;
  if (page === "budget") return <BudgetPage />;
  if (page === "notifications") return <NotificationPage />;
  return <EmptyState title={translateText("Halaman tidak ditemukan")} />;
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
  const { translateText } = useTranslation();
  return (
    <FeaturePage title={title} description={translateText(description)} showHeader={false}>
      {children}
    </FeaturePage>
  );
}
