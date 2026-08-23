"use client";
import { productRepository } from "@/features/products/repository";

import { marketplaceRepository } from "@/features/marketplace/repository";
import { useVendorProfile } from "@/features/profile/hooks/useVendorProfile";
import { canVendorSell, vendorProfileStatus } from "@/features/profile/rules";
import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { DetailGrid } from "@/shared/components/data-display/DetailBlocks";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { PopupConfirm } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { type FormField } from "@/shared/components/forms/EntityForm";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/FormFields";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import Link from "next/link";
import { type ReactNode } from "react";

export const PRODUCT_FORM_STEPS = ["Informasi Layanan", "Harga & Publikasi"];

export const productFields: FormField[] = [
  { label: "Nama produk atau paket", name: "name", required: true, step: 0 },
  {
    label: "Kategori",
    name: "category",
    type: "select",
    options: marketplaceRepository.categories().map((item) => item.name),
    required: true,
    step: 0,
  },
  { label: "Deskripsi layanan", name: "description", type: "textarea", required: true, step: 0 },
  { label: "Durasi layanan", name: "duration", placeholder: "Contoh: 8 jam", step: 0 },
  { label: "Kapasitas tamu", name: "capacity", type: "number", min: 1, step: 0 },
  {
    label: "Area layanan",
    name: "area",
    placeholder: "Contoh: Jabodetabek",
    required: true,
    step: 0,
  },
  { label: "Harga", name: "price", type: "number", min: 0, required: true, step: 1 },
  { label: "Minimal DP", name: "dp", type: "number", min: 0, step: 1 },
  {
    label: "Foto atau portofolio paket",
    name: "images",
    type: "file",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    helper: "Pilih beberapa foto JPG, PNG, atau WebP.",
    step: 1,
  },
  { label: "Syarat dan ketentuan", name: "terms", type: "textarea", required: true, step: 1 },
];

export function ProductAccessGate({ children }: { children: ReactNode }) {
  const vendor = useVendorProfile();
  const { profile } = vendor;
  if (vendor.loading)
    return (
      <Page title="Produk" description="Memeriksa status vendor...">
        <LoadingSkeleton />
      </Page>
    );
  if (vendor.error)
    return (
      <Page title="Produk" description="Status vendor tidak dapat dimuat.">
        <ErrorState retry={() => void vendor.reload()} />
      </Page>
    );
  const canSell = canVendorSell(profile);
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

export function ProductsPage() {
  return (
    <Page title="Kelola Produk" description="Kelola paket layanan, publikasi, dan status produk.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total produk" value={`${productRepository.list().length} produk`} />
        <DashboardCard
          label="Produk aktif"
          value={`${productRepository.list().filter((product) => product.status === "ACTIVE").length} produk`}
        />
        <DashboardCard
          label="Draft"
          value={`${productRepository.list().filter((product) => product.status === "DRAFT").length} produk`}
        />
        <DashboardCard
          label="Nonaktif"
          value={`${productRepository.list().filter((product) => product.status === "INACTIVE").length} produk`}
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
        rows={productRepository.list().map((p) => [
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
            <PopupConfirm
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
            <PopupConfirm
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

export function ProductDetailPage({ productId }: { productId: string }) {
  const product =
    productRepository.list().find((item) => item.id === productId) ?? productRepository.list()[0];

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
          <PopupConfirm
            trigger={<AppButton variant="outline">Nonaktifkan</AppButton>}
            title="Nonaktifkan produk?"
            description="Produk tidak akan tampil di marketplace sampai diaktifkan kembali."
          />
          <PopupConfirm
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
