import Link from "next/link";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import { DashboardCard } from "@/components/cards/Cards";
import { SectionHeader } from "@/components/common/Headers";
import { EntityForm, type FormField } from "@/components/forms/EntityForm";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { DetailGrid, PlaceholderPanel } from "@/features/shared/DetailBlocks";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { EmptyState } from "@/components/states/States";
import {
  mockCategories,
  mockNotifications,
  mockOrders,
  mockProducts,
  mockReviews,
  mockVendors,
} from "@/constants/mockData";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { ROUTES } from "@/constants/routes";
import { FeaturePage as Page } from "@/features/shared/FeaturePage";

const productFields: FormField[] = [
  { label: "Nama paket", name: "name", required: true },
  {
    label: "Kategori",
    name: "category",
    type: "select",
    options: mockCategories.map((item) => item.name),
    required: true,
  },
  { label: "Deskripsi", name: "description", type: "textarea", required: true },
  { label: "Harga", name: "price", type: "number", required: true },
  { label: "Minimum DP", name: "dp", type: "number" },
  { label: "Durasi", name: "duration" },
  { label: "Kapasitas tamu", name: "capacity", type: "number" },
  { label: "Area layanan", name: "area" },
  { label: "Syarat dan ketentuan", name: "terms", type: "textarea" },
  { label: "Foto produk", name: "images", type: "file" },
  { label: "Status", name: "status", type: "select", options: ["DRAFT", "ACTIVE"], required: true },
];

export function VendorPage({ slug }: { slug: string[] }) {
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request.
  if (page === "dashboard") return <VendorDashboard />;
  if (page === "profile")
    return (
      <Page title="Profil Bisnis" description="Informasi ini tampil di halaman toko vendor.">
        <ProfileForm type="vendor" />
      </Page>
    );
  if (page === "category") return <CategoryPage />;
  if (page === "verification-status") return <VerificationPage />;
  if (page === "products" && slug[1] === "create")
    return (
      <Page
        title="Buat Paket Layanan"
        description="Buat paket yang jelas agar customer mudah membandingkan."
      >
        <EntityForm
          fields={productFields}
          steps={[
            "Informasi Paket",
            "Harga & Kapasitas",
            "Area Layanan",
            "Foto & Portofolio",
            "Ketentuan",
            "Status Publish",
          ]}
          submitLabel="Publish paket"
        />
      </Page>
    );
  if (page === "products" && slug.includes("edit"))
    return (
      <Page title="Edit Paket Layanan" description="Perbarui detail dan status paket.">
        <EntityForm
          fields={productFields}
          steps={[
            "Informasi Paket",
            "Harga & Kapasitas",
            "Area Layanan",
            "Foto & Portofolio",
            "Ketentuan",
            "Status Publish",
          ]}
          submitLabel="Simpan perubahan"
        />
      </Page>
    );
  if (page === "products") return <ProductsPage />;
  if (page === "orders" && slug[1]) return <OrderDetail />;
  if (page === "orders") return <OrdersPage />;
  if (page === "reviews")
    return (
      <Page title="Ulasan Customer" description="Masukan customer terhadap layanan Anda.">
        <DataTable
          columns={["Customer", "Rating", "Komentar", "Status"]}
          rows={mockReviews.map((r) => [
            r.customerName,
            `★ ${r.rating}`,
            r.comment,
            <StatusBadge status={r.status} />,
          ])}
        />
      </Page>
    );
  if (page === "notifications")
    return (
      <Page title="Notifikasi" description="Pembaruan pesanan dan akun vendor.">
        <div className="grid gap-3">
          {mockNotifications.map((n) => (
            <article className="rounded-2xl border bg-white p-5" key={n.id}>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="text-sm text-stone-500">{n.message}</p>
            </article>
          ))}
        </div>
      </Page>
    );
  return <EmptyState title="Halaman tidak ditemukan" />;
}
function VendorDashboard() {
  // TODO API: Ambil ringkasan dashboard vendor dari backend
  return (
    <Page title="Seller Center" description="Pantau performa bisnis dan pesanan terbaru.">
      <section className="rounded-[2rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <StatusBadge status="VERIFIED_ACTIVE" />
            <h2 className="mt-3 text-2xl font-semibold">Selamat datang, Atelier Aurora</h2>
            <p className="mt-1 text-sm text-stone-500">
              Profil Anda aktif dan dapat menerima pesanan baru.
            </p>
          </div>
          <AppButton asChild>
            <Link href={ROUTES.vendor.createProduct}>Buat paket baru</Link>
          </AppButton>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total paket" value="12" />
        <DashboardCard label="Pesanan masuk" value="8" />
        <DashboardCard label="Pesanan selesai" value="146" />
        <DashboardCard label="Pendapatan bulan ini" value={formatCurrency(184000000)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <PlaceholderPanel
          title="Ringkasan revenue"
          description="Grafik pendapatan dan tren booking akan tampil di sini."
        />
        <DataTable
          title="Pesanan terbaru"
          columns={["Nomor", "Customer", "Status", "Total"]}
          rows={mockOrders.map((o) => [
            o.number,
            o.customerName,
            <StatusBadge status={o.status} />,
            formatCurrency(o.total),
          ])}
        />
      </div>
    </Page>
  );
}
function VerificationPage() {
  return (
    <Page title="Status Verifikasi" description="Pantau proses verifikasi bisnis Anda.">
      <DetailGrid
        items={[
          ["Status", <StatusBadge status="PENDING_VERIFICATION" />],
          ["Tanggal diajukan", "3 Juni 2026"],
          ["Catatan admin", "Dokumen sedang diperiksa."],
          ["Alasan penolakan", "-"],
        ]}
      />
      <AppButton className="w-fit" variant="secondary">
        Kirim ulang dokumen
      </AppButton>
    </Page>
  );
}
function CategoryPage() {
  return (
    <Page
      title="Kategori Vendor"
      description="Pilih minimal satu kategori yang sesuai dengan layanan."
    >
      <div className="rounded-2xl border bg-white p-6">
        <AppInput label="Cari kategori" placeholder="Contoh: Catering" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {mockCategories.map((item, index) => (
            <label className="flex gap-3 rounded-xl border p-3 text-sm" key={item.id}>
              <input type="checkbox" defaultChecked={index < 2} /> {item.name}
            </label>
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-500">Terpilih: Decoration, Wedding Organizer</p>
        <AppButton className="mt-5">Simpan kategori</AppButton>
      </div>
    </Page>
  );
}
function ProductsPage() {
  return (
    <Page title="Kelola Produk" description="Kelola paket layanan, publikasi, dan status produk.">
      <div className="flex gap-3">
        <AppInput label="Cari produk" placeholder="Nama paket" />
        <AppButton asChild>
          <Link href={ROUTES.vendor.createProduct}>Buat paket</Link>
        </AppButton>
      </div>
      <DataTable
        columns={["Produk", "Kategori", "Harga", "Status", "Aksi"]}
        rows={mockProducts.map((p) => [
          p.name,
          p.category,
          formatCurrency(p.price),
          <StatusBadge status={p.status} />,
          <div className="flex gap-2" key={p.id}>
            <AppButton asChild variant="secondary">
              <Link href={ROUTES.vendor.editProduct(p.id)}>Edit</Link>
            </AppButton>
            <ConfirmModal
              trigger={<AppButton variant="danger">Nonaktifkan</AppButton>}
              title="Nonaktifkan produk?"
              description="Produk tidak akan tampil di marketplace."
            />
          </div>,
        ])}
      />
    </Page>
  );
}
function OrdersPage() {
  return (
    <Page title="Pesanan Vendor" description="Tinjau pesanan masuk dan status pelaksanaan.">
      <DataTable
        columns={[
          "Nomor",
          "Customer",
          "Paket",
          "Tanggal",
          "Lokasi",
          "Pembayaran",
          "Status",
          "Aksi",
        ]}
        rows={mockOrders.map((o) => [
          o.number,
          o.customerName,
          o.productName,
          formatDate(o.eventDate),
          o.location,
          <StatusBadge status={o.paymentStatus} />,
          <StatusBadge status={o.status} />,
          <Link className="font-semibold text-blush" href={ROUTES.vendor.order(o.id)}>
            Detail
          </Link>,
        ])}
      />
    </Page>
  );
}
function OrderDetail() {
  const o = mockOrders[0];
  return (
    <Page
      title={`Pesanan ${o.number}`}
      description="Tinjau kebutuhan customer sebelum menerima pesanan."
    >
      <DetailGrid
        items={[
          ["Customer", o.customerName],
          ["Paket", o.productName],
          ["Tanggal", formatDate(o.eventDate)],
          ["Lokasi", o.location],
          ["Jumlah tamu", "500 tamu"],
          ["Pembayaran", <StatusBadge status={o.paymentStatus} />],
          ["Catatan customer", "Mohon gunakan palet warna rose dan ivory."],
        ]}
      />
      <div className="flex gap-3">
        <AppButton>Terima pesanan</AppButton>
        <ConfirmModal
          requireReason
          trigger={<AppButton variant="danger">Tolak pesanan</AppButton>}
          title="Tolak pesanan?"
          description="Alasan penolakan wajib disampaikan kepada customer."
        />
      </div>
      <section className="rounded-2xl border bg-white p-6">
        <SectionHeader
          title="Update progress"
          description="Placeholder pembaruan progres layanan untuk customer."
        />
      </section>
    </Page>
  );
}
