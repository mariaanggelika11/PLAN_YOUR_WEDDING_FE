import Link from "next/link";
import { AppButton } from "@/components/ui/AppButton";
import { DashboardCard } from "@/components/cards/Cards";
import { PageHeader } from "@/components/common/Headers";
import { DetailGrid, PlaceholderPanel } from "@/features/shared/DetailBlocks";
import { DataTable } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { EmptyState } from "@/components/states/States";
import {
  mockAdminSummary,
  mockCategories,
  mockDisputes,
  mockOrders,
  mockPayments,
  mockReviews,
  mockUsers,
  mockVendors,
} from "@/constants/mockData";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

export function AdminPage({ slug }: { slug: string[] }) {
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request admin.
  if (page === "dashboard") return <AdminDashboard />;
  if (page === "vendor-verification" && slug[1]) return <VendorVerificationDetail />;
  if (page === "vendor-verification") return <VendorVerification />;
  if (page === "payment-verification" && slug[1]) return <PaymentDetail />;
  if (page === "payment-verification") return <PaymentVerification />;
  if (page === "users")
    return (
      <Page title="Manajemen Pengguna" description="Kelola status dan akses pengguna.">
        <DataTable
          columns={["Nama", "Email", "Role", "Status", "Aksi"]}
          rows={mockUsers.map((u) => [
            u.name,
            u.email,
            u.role,
            <StatusBadge status={u.status} />,
            <AppButton variant="secondary" key={u.id}>
              Suspend
            </AppButton>,
          ])}
        />
      </Page>
    );
  if (page === "vendors")
    return (
      <Page title="Manajemen Vendor" description="Tinjau seluruh akun bisnis.">
        <DataTable
          columns={["Vendor", "Pemilik", "Lokasi", "Status", "Aksi"]}
          rows={mockVendors.map((v) => [
            v.name,
            v.ownerName,
            v.city,
            <StatusBadge status={v.status} />,
            <AppButton variant="secondary" key={v.id}>
              Detail
            </AppButton>,
          ])}
        />
      </Page>
    );
  if (page === "categories")
    return (
      <Page title="Manajemen Kategori" description="Kelola kategori marketplace.">
        <AppButton className="w-fit">Tambah kategori</AppButton>
        <DataTable
          columns={["Kategori", "Status", "Aksi"]}
          rows={mockCategories.slice(0, 8).map((c) => [
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
          rows={mockOrders.map((o) => [
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
          rows={mockOrders.map((o) => [
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
          rows={mockReviews.map((r) => [
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
function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-7">
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}
function AdminDashboard() {
  const s = mockAdminSummary;
  /* TODO API: Ambil ringkasan dashboard admin dari backend */ return (
    <Page title="Admin Dashboard" description="Ringkasan operasional Plan Your Wedding.">
      <section className="rounded-[2rem] bg-gradient-to-r from-[#101828] to-slate-700 p-7 text-white shadow-2xl">
        <p className="text-sm text-slate-300">Marketplace health</p>
        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold">Semua sistem berjalan normal</h2>
            <p className="mt-2 text-sm text-slate-300">
              18 vendor dan 27 pembayaran membutuhkan perhatian.
            </p>
          </div>
          <AppButton asChild>
            <Link href="/admin/vendor-verification">Buka antrean verifikasi</Link>
          </AppButton>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total pengguna" value={s.totalUsers} />
        <DashboardCard label="Total vendor" value={s.totalVendors} />
        <DashboardCard label="Vendor pending" value={s.pendingVendors} />
        <DashboardCard label="Pembayaran pending" value={s.pendingPayments} />
        <DashboardCard label="Total pesanan" value={s.totalOrders} />
        <DashboardCard label="Sengketa terbuka" value={s.openDisputes} />
        <DashboardCard label="Revenue" value={formatCurrency(s.revenue)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderPanel
          title="Revenue & order trend"
          description="Visualisasi performa marketplace per periode."
        />
        <DataTable
          title="Aktivitas terbaru"
          columns={["Aksi", "Entity", "Waktu"]}
          rows={[
            ["Vendor disetujui", "Atelier Aurora", "10 menit lalu"],
            ["Pembayaran diverifikasi", "PYW-260602", "22 menit lalu"],
            ["Sengketa dibuka", "D-1004", "1 jam lalu"],
          ]}
        />
      </div>
    </Page>
  );
}
function VendorVerification() {
  return (
    <Page title="Verifikasi Vendor" description="Periksa bisnis yang menunggu persetujuan.">
      <DataTable
        columns={["Vendor", "Pemilik", "Kategori", "Lokasi", "Diajukan", "Status", "Aksi"]}
        rows={mockVendors.map((v) => [
          v.name,
          v.ownerName,
          v.categories.join(", "),
          v.city,
          "3 Juni 2026",
          <StatusBadge status={v.status} />,
          <Link className="font-semibold text-blush" href={`/admin/vendor-verification/${v.id}`}>
            Detail
          </Link>,
        ])}
      />
    </Page>
  );
}
function VendorVerificationDetail() {
  const v = mockVendors[2];
  return (
    <Page
      title={`Verifikasi ${v.name}`}
      description="Periksa profil, portfolio, dan dokumen bisnis."
    >
      <DetailGrid
        items={[
          ["Nama bisnis", v.name],
          ["Pemilik", v.ownerName],
          ["Kategori", v.categories.join(", ")],
          ["Lokasi", v.city],
          ["Deskripsi", v.description],
          ["Status", <StatusBadge status={v.status} />],
        ]}
      />
      <PlaceholderPanel
        title="Dokumen & portfolio"
        description="Preview dokumen legal dan karya vendor."
      />
      <div className="flex gap-3">
        <AppButton>Approve vendor</AppButton>
        <ConfirmModal
          requireReason
          trigger={<AppButton variant="danger">Reject vendor</AppButton>}
          title="Tolak vendor?"
          description="Alasan penolakan wajib diisi sebelum dikirim."
        />
        <AppButton variant="secondary">Minta revisi</AppButton>
      </div>
    </Page>
  );
}
function PaymentVerification() {
  return (
    <Page title="Verifikasi Pembayaran" description="Periksa bukti transfer manual dari customer.">
      <DataTable
        columns={[
          "Payment ID",
          "Order",
          "Customer",
          "Vendor",
          "Jumlah",
          "Status",
          "Tanggal",
          "Aksi",
        ]}
        rows={mockPayments.map((p) => [
          p.id,
          p.orderNumber,
          p.customerName,
          p.vendorName,
          formatCurrency(p.amount),
          <StatusBadge status={p.status} />,
          formatDate(p.uploadedAt),
          <Link className="font-semibold text-blush" href={`/admin/payment-verification/${p.id}`}>
            Detail
          </Link>,
        ])}
      />
    </Page>
  );
}
function PaymentDetail() {
  const p = mockPayments[0];
  return (
    <Page
      title={`Verifikasi ${p.id}`}
      description="Bandingkan bukti transfer dengan informasi pesanan."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderPanel
          title="Preview bukti pembayaran"
          description="Gambar bukti transfer dari customer."
        />
        <DetailGrid
          items={[
            ["Order", p.orderNumber],
            ["Customer", p.customerName],
            ["Vendor", p.vendorName],
            ["Jumlah tagihan", formatCurrency(p.amount)],
            ["Jumlah transfer", formatCurrency(p.amount)],
            ["Status", <StatusBadge status={p.status} />],
          ]}
        />
      </div>
      <div className="flex gap-3">
        <AppButton>Approve pembayaran</AppButton>
        <ConfirmModal
          requireReason
          trigger={<AppButton variant="danger">Reject pembayaran</AppButton>}
          title="Tolak pembayaran?"
          description="Alasan penolakan wajib diisi."
        />
        <AppButton variant="secondary">Minta upload ulang</AppButton>
      </div>
    </Page>
  );
}
function Reports() {
  return (
    <Page title="Report Overview" description="Tren bisnis dan performa marketplace.">
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard label="Revenue bulan ini" value={formatCurrency(840000000)} />
        <DashboardCard label="Kategori populer" value="Catering" />
        <DashboardCard label="Top vendor" value="Atelier Aurora" />
      </div>
      <PlaceholderPanel
        title="Tren pesanan"
        description="Placeholder visualisasi order dan revenue."
      />
    </Page>
  );
}
function AuditLogs() {
  return (
    <Page title="Audit Log" description="Riwayat aktivitas penting di sistem.">
      <DataTable
        columns={["Aksi", "User", "Entity", "Entity ID", "Timestamp", "IP Address"]}
        rows={[
          ["APPROVE_VENDOR", "Admin PYW", "Vendor", "v3", "7 Juni 2026, 10.30", "192.0.2.xxx"],
          ["VERIFY_PAYMENT", "Admin PYW", "Payment", "pay1", "7 Juni 2026, 09.15", "192.0.2.xxx"],
        ]}
      />
    </Page>
  );
}
