"use client";
import dynamic from "next/dynamic";

import { useTranslation } from "@/shared/i18n/useTranslation";

import { EmptyState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";

const AdminOrderDetail = dynamic(
  () => import("./AdminOrderDetail").then((module) => module.AdminOrderDetail),
  { loading: () => <LoadingSkeleton /> },
);
const LiveMonitoring = dynamic(
  () => import("./LiveMonitoring").then((module) => module.LiveMonitoring),
  { loading: () => <LoadingSkeleton /> },
);
const AdminProfileForm = dynamic(
  () => import("@/features/admin/AdminProfileForm").then((module) => module.AdminProfileForm),
  { loading: () => <LoadingSkeleton /> },
);
const AdminDashboard = dynamic(
  () => import("@/features/admin/DashboardPage").then((module) => module.AdminDashboard),
  { loading: () => <LoadingSkeleton /> },
);
const AuditLogs = dynamic(
  () => import("@/features/admin/MonitoringPages").then((module) => module.AuditLogs),
  { loading: () => <LoadingSkeleton /> },
);
const Reports = dynamic(
  () => import("@/features/admin/MonitoringPages").then((module) => module.Reports),
  { loading: () => <LoadingSkeleton /> },
);
const AdminUsersPage = dynamic(
  () => import("@/features/admin/UserManagementPage").then((module) => module.AdminUsersPage),
  { loading: () => <LoadingSkeleton /> },
);
const AdminVendorsPage = dynamic(
  () => import("@/features/admin/VendorManagementPage").then((module) => module.AdminVendorsPage),
  { loading: () => <LoadingSkeleton /> },
);
const AdminVendorVerificationDetailPage = dynamic(
  () =>
    import("@/features/admin/VerificationPages").then(
      (module) => module.AdminVendorVerificationDetailPage,
    ),
  { loading: () => <LoadingSkeleton /> },
);
const AdminVendorVerificationPage = dynamic(
  () =>
    import("@/features/admin/VerificationPages").then(
      (module) => module.AdminVendorVerificationPage,
    ),
  { loading: () => <LoadingSkeleton /> },
);
const PaymentDetail = dynamic(
  () => import("@/features/admin/VerificationPages").then((module) => module.PaymentDetail),
  { loading: () => <LoadingSkeleton /> },
);
const PaymentVerification = dynamic(
  () => import("@/features/admin/VerificationPages").then((module) => module.PaymentVerification),
  { loading: () => <LoadingSkeleton /> },
);
const ParameterManager = dynamic(
  () => import("@/features/parameters/ParameterManager").then((module) => module.ParameterManager),
  { loading: () => <LoadingSkeleton /> },
);
const TermsVersionManager = dynamic(
  () => import("@/features/terms/TermsVersionManager").then((module) => module.TermsVersionManager),
  { loading: () => <LoadingSkeleton /> },
);

export function AdminPage({ slug }: { slug: string[] }) {
  const { translateText } = useTranslation();
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request admin.
  if (page === "orders" && slug[1]) return <AdminOrderDetail key={slug[1]} id={slug[1]} />;
  if (page === "dashboard") return <AdminDashboard />;
  if (page === "profile")
    return (
      <Page
        title={translateText("Profile Admin")}
        description={translateText("Kelola informasi akun administrator.")}
      >
        <AdminProfileForm />
      </Page>
    );
  if (page === "vendor-verification" && slug[1])
    return <AdminVendorVerificationDetailPage vendorId={slug[1]} />;
  if (page === "vendor-verification") return <AdminVendorVerificationPage />;
  if (page === "payment-verification" && slug[1]) return <PaymentDetail paymentId={slug[1]} />;
  if (page === "payment-verification") return <PaymentVerification />;
  if (page === "parameters")
    return (
      <Page
        title="Master Setup"
        description={translateText(
          "Kelola parameter dan konfigurasi sistem yang hanya dapat diakses administrator.",
        )}
      >
        <ParameterManager />
      </Page>
    );
  if (page === "terms")
    return (
      <Page
        title={translateText("Syarat & Ketentuan")}
        description={translateText(
          "Kelola versi syarat dan ketentuan customer dan vendor beserta riwayat persetujuannya.",
        )}
      >
        <TermsVersionManager />
      </Page>
    );
  if (page === "users") return <AdminUsersPage />;
  if (page === "vendors") return <AdminVendorsPage />;
  if (page === "categories")
    return (
      <Page
        title={translateText("Kategori dan parameter")}
        description={translateText("Kelola kategori melalui Master Setup.")}
      >
        <ParameterManager />
      </Page>
    );
  if (["products", "orders", "reviews", "disputes"].includes(page))
    return (
      <LiveMonitoring key={page} kind={page as "products" | "orders" | "reviews" | "disputes"} />
    );
  if (page === "reports") return <Reports />;
  if (page === "audit-logs") return <AuditLogs />;
  return <EmptyState title={translateText("Halaman tidak ditemukan")} />;
}
