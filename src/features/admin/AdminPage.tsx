import { AdminOrderDetail } from "./AdminOrderDetail";
import { LiveMonitoring } from "./LiveMonitoring";
import { EmptyState } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";

import { AdminProfileForm } from "@/features/admin/AdminProfileForm";
import { AdminDashboard } from "@/features/admin/DashboardPage";
import { AuditLogs, Reports } from "@/features/admin/MonitoringPages";
import { AdminUsersPage } from "@/features/admin/UserManagementPage";
import { AdminVendorsPage } from "@/features/admin/VendorManagementPage";
import {
  AdminVendorVerificationDetailPage,
  AdminVendorVerificationPage,
  PaymentDetail,
  PaymentVerification,
} from "@/features/admin/VerificationPages";
import { ParameterManager } from "@/features/parameters/ParameterManager";

export function AdminPage({ slug }: { slug: string[] }) {
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request admin.
  if (page === "orders" && slug[1]) return <AdminOrderDetail key={slug[1]} id={slug[1]} />;
  if (page === "dashboard") return <AdminDashboard />;
  if (page === "profile")
    return (
      <Page title="Profile Admin" description="Kelola informasi akun administrator.">
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
        description="Kelola parameter dan konfigurasi sistem yang hanya dapat diakses administrator."
      >
        <ParameterManager />
      </Page>
    );
  if (page === "users") return <AdminUsersPage />;
  if (page === "vendors") return <AdminVendorsPage />;
  if (page === "categories")
    return (
      <Page title="Kategori dan parameter" description="Kelola kategori melalui Master Setup.">
        <ParameterManager />
      </Page>
    );
  if (["products", "orders", "reviews", "disputes"].includes(page))
    return (
      <LiveMonitoring key={page} kind={page as "products" | "orders" | "reviews" | "disputes"} />
    );
  if (page === "reports") return <Reports />;
  if (page === "audit-logs") return <AuditLogs />;
  return <EmptyState title="Halaman tidak ditemukan" />;
}
