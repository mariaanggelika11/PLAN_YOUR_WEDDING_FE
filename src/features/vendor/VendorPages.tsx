"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
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
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/states/States";
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
import { getVendorProfile } from "@/services/profileService";
import type { VendorApiProfile } from "@/types/profile";

const productFields: FormField[] = [
  { label: "Nama produk atau paket", name: "name", required: true, step: 0 },
  {
    label: "Kategori",
    name: "category",
    type: "select",
    options: mockCategories.map((item) => item.name),
    required: true,
    step: 0,
  },
  { label: "Deskripsi layanan", name: "description", type: "textarea", required: true, step: 0 },
  { label: "Harga", name: "price", type: "number", min: 0, required: true, step: 1 },
  { label: "Minimal DP", name: "dp", type: "number", min: 0, step: 1 },
  { label: "Durasi layanan", name: "duration", placeholder: "Contoh: 8 jam", step: 1 },
  { label: "Kapasitas tamu", name: "capacity", type: "number", min: 1, step: 1 },
  {
    label: "Area layanan",
    name: "area",
    placeholder: "Contoh: Jabodetabek",
    required: true,
    step: 2,
  },
  {
    label: "Foto atau portofolio paket",
    name: "images",
    type: "file",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    helper: "Pilih beberapa foto JPG, PNG, atau WebP.",
    step: 3,
  },
  { label: "Syarat dan ketentuan", name: "terms", type: "textarea", required: true, step: 4 },
  {
    label: "Status produk",
    name: "status",
    type: "select",
    options: ["DRAFT", "ACTIVE", "INACTIVE"],
    required: true,
    step: 5,
  },
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
  if (page === "products" && slug[1] === "create")
    return (
      <ProductAccessGate>
        <Page
          title="Buat Paket Layanan"
          description="Buat paket yang jelas agar customer mudah membandingkan."
        >
          <EntityForm
            fields={productFields}
            steps={[
              "Informasi Layanan",
              "Harga & Kapasitas",
              "Area Layanan",
              "Foto & Portofolio",
              "Ketentuan",
              "Status Publish",
            ]}
            note="Pilih Draft jika produk belum siap ditampilkan."
            submitLabel="Publish paket"
          />
        </Page>
      </ProductAccessGate>
    );
  if (page === "products" && slug.includes("edit"))
    return (
      <ProductAccessGate>
        <Page title="Edit Paket Layanan" description="Perbarui detail dan status paket.">
          <EntityForm
            fields={productFields}
            steps={[
              "Informasi Layanan",
              "Harga & Kapasitas",
              "Area Layanan",
              "Foto & Portofolio",
              "Ketentuan",
              "Status Publish",
            ]}
            note="Perubahan harga hanya berlaku untuk pesanan baru dan tidak mengubah nilai pesanan yang sudah dibuat."
            submitLabel="Simpan perubahan"
          />
        </Page>
      </ProductAccessGate>
    );
  if (page === "products" && slug[1])
    return (
      <ProductAccessGate>
        <ProductDetailPage productId={slug[1]} />
      </ProductAccessGate>
    );
  if (page === "products")
    return (
      <ProductAccessGate>
        <ProductsPage />
      </ProductAccessGate>
    );
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
function ProductAccessGate({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<VendorApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setProfile(await getVendorProfile());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);
  if (loading)
    return (
      <Page title="Produk" description="Memeriksa status vendor...">
        <LoadingSkeleton />
      </Page>
    );
  if (failed)
    return (
      <Page title="Produk" description="Status vendor tidak dapat dimuat.">
        <ErrorState retry={() => void load()} />
      </Page>
    );
  const canSell = Boolean(
    profile?.isVerified && profile.active !== false && ![5, 6].includes(profile.status ?? 0),
  );
  if (!canSell) {
    return (
      <Page
        title="Produk belum tersedia"
        description="Selesaikan verifikasi bisnis untuk mulai berjualan."
      >
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
          <StatusBadge status={vendorProfileStatus(profile?.status)} />
          <h2 className="mt-4 text-xl font-semibold text-ink">
            {profile?.isVerified ? "Akses produk sedang tidak aktif" : "Bisnis belum diverifikasi"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            {profile?.isVerified
              ? "Hubungi admin untuk mengaktifkan kembali akun vendor Anda."
              : "Lengkapi profil dan dokumen bisnis. Setelah disetujui admin, menu produk akan terbuka tanpa perlu verifikasi ulang."}
          </p>
          <AppButton asChild className="mt-5">
            <Link href={ROUTES.vendor.profile}>Buka profil bisnis</Link>
          </AppButton>
        </div>
      </Page>
    );
  }
  return children;
}

function vendorProfileStatus(status?: number | null) {
  return (
    (
      {
        1: "DRAFT",
        2: "PENDING_VERIFICATION",
        3: "VERIFIED",
        4: "REJECTED",
        5: "SUSPENDED",
        6: "INACTIVE",
      } as const
    )[status as 1] ?? "INACTIVE"
  );
}
function ProductsPage() {
  return (
    <Page title="Kelola Produk" description="Kelola paket layanan, publikasi, dan status produk.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total produk" value={`${mockProducts.length} produk`} />
        <DashboardCard
          label="Produk aktif"
          value={`${mockProducts.filter((product) => product.status === "ACTIVE").length} produk`}
        />
        <DashboardCard
          label="Draft"
          value={`${mockProducts.filter((product) => product.status === "DRAFT").length} produk`}
        />
        <DashboardCard
          label="Nonaktif"
          value={`${mockProducts.filter((product) => product.status === "INACTIVE").length} produk`}
        />
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <AppInput label="Cari produk" placeholder="Nama produk atau paket" />
        </div>
        <label className="grid gap-1.5 text-sm font-medium">
          <span>Status</span>
          <select className="min-h-11 rounded-xl border bg-white px-3.5 text-sm shadow-sm">
            <option>Semua status</option>
            <option>DRAFT</option>
            <option>ACTIVE</option>
            <option>INACTIVE</option>
            <option>REJECTED</option>
            <option>DELETED</option>
          </select>
        </label>
        <AppButton asChild>
          <Link href={ROUTES.vendor.createProduct}>Buat paket baru</Link>
        </AppButton>
      </div>
      <DataTable
        title="Daftar produk dan paket layanan"
        columns={["Produk", "Kategori", "Harga", "Kapasitas", "Area", "Status", "Aksi"]}
        rows={mockProducts.map((p) => [
          <Link
            className="font-semibold text-ink hover:text-blush"
            href={ROUTES.vendor.product(p.id)}
            key={p.id}
          >
            {p.name}
          </Link>,
          p.category,
          formatCurrency(p.price),
          `${p.guestCapacity} tamu`,
          p.serviceArea,
          <StatusBadge status={p.status} />,
          <div className="flex flex-wrap gap-2" key={p.id}>
            <AppButton asChild variant="ghost">
              <Link href={ROUTES.vendor.product(p.id)}>Detail</Link>
            </AppButton>
            <AppButton asChild variant="secondary">
              <Link href={ROUTES.vendor.editProduct(p.id)}>Edit</Link>
            </AppButton>
            <ConfirmModal
              trigger={
                <AppButton variant="outline">
                  {p.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                </AppButton>
              }
              title={p.status === "ACTIVE" ? "Nonaktifkan produk?" : "Aktifkan produk?"}
              description={
                p.status === "ACTIVE"
                  ? "Produk tidak akan tampil di marketplace sampai diaktifkan kembali."
                  : "Produk akan tampil di marketplace jika akun vendor sudah terverifikasi."
              }
            />
            <ConfirmModal
              trigger={<AppButton variant="danger">Hapus</AppButton>}
              title="Hapus produk secara sistem?"
              description="Produk akan berstatus Deleted dan tidak dihapus permanen agar riwayat transaksi tetap tersimpan."
            />
          </div>,
        ])}
      />
    </Page>
  );
}

function ProductDetailPage({ productId }: { productId: string }) {
  const product = mockProducts.find((item) => item.id === productId) ?? mockProducts[0];

  return (
    <Page
      title={product.name}
      description="Detail produk atau paket layanan yang ditampilkan kepada customer."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        <StatusBadge status={product.status} />
        <div className="flex flex-wrap gap-2">
          <AppButton asChild variant="secondary">
            <Link href={ROUTES.vendor.editProduct(product.id)}>Edit produk</Link>
          </AppButton>
          <ConfirmModal
            trigger={<AppButton variant="outline">Nonaktifkan</AppButton>}
            title="Nonaktifkan produk?"
            description="Produk tidak akan tampil di marketplace sampai diaktifkan kembali."
          />
          <ConfirmModal
            trigger={<AppButton variant="danger">Hapus</AppButton>}
            title="Hapus produk secara sistem?"
            description="Produk akan disembunyikan dengan status Deleted tanpa menghapus riwayat transaksi."
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="overflow-hidden rounded-3xl border bg-white">
          <img
            alt={product.name}
            className="aspect-[4/3] size-full object-cover"
            src={product.image}
          />
        </div>
        <DetailGrid
          items={[
            ["Nama paket", product.name],
            ["Kategori", product.category],
            ["Harga", formatCurrency(product.price)],
            ["Minimal DP", formatCurrency(product.minimumDp)],
            ["Durasi layanan", product.duration],
            ["Kapasitas", `${product.guestCapacity} tamu`],
            ["Area layanan", product.serviceArea],
            ["Status", <StatusBadge status={product.status} />],
            ["Deskripsi", product.description],
            [
              "Syarat dan ketentuan",
              "Mengikuti kesepakatan layanan dan jadwal yang telah dikonfirmasi.",
            ],
          ]}
        />
      </div>
      <p className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        Perubahan harga tidak akan mengubah harga pada pesanan yang sudah dibuat sebelumnya.
      </p>
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
