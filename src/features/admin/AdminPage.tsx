import { mockOrders } from "@/mocks/mockData";
import { reviewRepository } from "@/features/reviews/repository";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { EmptyState } from "@/shared/components/feedback/AsyncStates";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { formatCurrency } from "@/shared/utils/formatCurrency";

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
import { marketplaceRepository } from "@/features/marketplace/repository";
import { ParameterManager } from "@/features/parameters/ParameterManager";
import { mockDisputes } from "@/mocks/mockData";

export function AdminPage({ slug }: { slug: string[] }) {
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request admin.
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
      <Page title="Manajemen Kategori" description="Kelola kategori marketplace.">
        <AppButton className="w-fit">Tambah kategori</AppButton>
        <DataTable
          columns={["Kategori", "Status", "Aksi"]}
          rows={marketplaceRepository
            .categories()
            .slice(0, 8)
            .map((c) => [
              c.name,
              <StatusBadge status="ACTIVE" />,
              <AppButton variant="secondary" key={c.id}>
                Edit
              </AppButton>,
            ])}
        />
      </Page>
    );
  if (page === "products")
    return (
      <Page
        title="Manajemen Produk"
        description="Pantau paket aktif, draft, dan produk bermasalah."
      >
        <DataTable
          columns={["Produk", "Vendor", "Kategori", "Harga", "Status"]}
          rows={mockOrders
            .map((o) => [
              o.productName,
              o.vendorName,
              "Wedding Package",
              formatCurrency(o.total),
              <StatusBadge status="ACTIVE" />,
            ])}
        />
      </Page>
    );
  if (page === "orders")
    return (
      <Page title="Monitoring Pesanan" description="Pantau seluruh transaksi marketplace.">
        <DataTable
          columns={["Nomor", "Customer", "Vendor", "Total", "Status"]}
          rows={mockOrders
            .map((o) => [
              o.number,
              o.customerName,
              o.vendorName,
              formatCurrency(o.total),
              <StatusBadge status={o.status} />,
            ])}
        />
      </Page>
    );
  if (page === "reviews")
    return (
      <Page title="Moderasi Ulasan" description="Sembunyikan ulasan yang melanggar kebijakan.">
        <DataTable
          columns={["Customer", "Vendor", "Rating", "Komentar", "Status", "Aksi"]}
          rows={reviewRepository.list().map((r) => [
            r.customerName,
            r.vendorName,
            `★ ${r.rating}`,
            r.comment,
            <StatusBadge status={r.status} />,
            <AppButton variant="secondary" key={r.id}>
              Sembunyikan
            </AppButton>,
          ])}
        />
      </Page>
    );
  if (page === "disputes")
    return (
      <Page title="Manajemen Sengketa" description="Tinjau laporan dan mediasi transaksi.">
        <DataTable
          columns={["ID", "Pelapor", "Pihak terlapor", "Alasan", "Status", "Aksi"]}
          rows={mockDisputes.map((d) => [
            d.id,
            d.reporter,
            d.reportedParty,
            d.reason,
            <StatusBadge status={d.status} />,
            <AppButton variant="secondary" key={d.id}>
              Detail
            </AppButton>,
          ])}
        />
      </Page>
    );
  if (page === "reports") return <Reports />;
  if (page === "audit-logs") return <AuditLogs />;
  return <EmptyState title="Halaman tidak ditemukan" />;
}
