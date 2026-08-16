import { ReviewList } from "@/features/customer/OrderPages";
import { marketplaceRepository } from "@/features/marketplace/repository";
import { orderRepository } from "@/features/orders/repository";
import { productRepository } from "@/features/products/repository";
import { ProductCard } from "@/shared/components/data-display/Cards";
import { PriceBreakdown } from "@/shared/components/data-display/Commerce";
import { DetailGrid, PlaceholderPanel } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { EntityForm, type FormField } from "@/shared/components/forms/EntityForm";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import {
  Accordion,
  DragDropUpload,
  Stepper,
  Tabs,
} from "@/shared/components/navigation/Interactive";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { Copy, Heart, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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

const checkoutFields: FormField[] = [
  { label: "Tanggal acara", name: "date", type: "date", required: true },
  { label: "Lokasi acara", name: "location", required: true },
  { label: "Jumlah tamu", name: "guests", type: "number", required: true },
  { label: "Catatan untuk vendor", name: "notes", type: "textarea" },
];

export function VendorDetail() {
  const vendor = marketplaceRepository.vendors()[0];
  // TODO API: Ambil detail vendor, daftar package, dan review vendor
  return (
    <div className="grid gap-6">
      <section className="relative h-72 overflow-hidden rounded-[2rem]">
        <Image src={vendor.image} alt={vendor.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold">
            Terverifikasi
          </span>
          <h1 className="mt-3 text-4xl font-semibold">{vendor.name}</h1>
          <p className="mt-2 text-sm text-stone-200">
            {vendor.city} · ★ {vendor.rating}
          </p>
        </div>
        <div className="absolute right-5 top-5 flex gap-2">
          <AppButton aria-label="Bagikan vendor" variant="secondary" className="px-3">
            <Share2 size={17} />
          </AppButton>
          <AppButton aria-label="Simpan vendor" variant="secondary" className="px-3">
            <Heart size={17} />
          </AppButton>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <Tabs
          items={[
            {
              label: "Overview",
              content: (
                <DetailGrid
                  items={[
                    ["Kategori", vendor.categories.join(", ")],
                    ["Area layanan", vendor.city],
                    ["Deskripsi", vendor.description],
                    ["Rating", `${vendor.rating} / 5`],
                  ]}
                />
              ),
            },
            {
              label: "Packages",
              content: (
                <div className="grid gap-4 md:grid-cols-2">
                  {productRepository.list().map((p) => (
                    <ProductCard product={p} key={p.id} />
                  ))}
                </div>
              ),
            },
            {
              label: "Portfolio",
              content: (
                <PlaceholderPanel
                  title="Portfolio gallery"
                  description="Dokumentasi karya terbaru vendor."
                />
              ),
            },
            { label: "Reviews", content: <ReviewList /> },
            {
              label: "Terms",
              content: (
                <PlaceholderPanel
                  title="Ketentuan vendor"
                  description="Ketentuan booking, revisi, dan pembatalan."
                />
              ),
            },
          ]}
        />
        <aside className="h-fit rounded-3xl border bg-white p-5 shadow-soft lg:sticky lg:top-24">
          <p className="text-xs text-stone-400">Harga paket mulai</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(productRepository.list()[0].price)}
          </p>
          <div className="mt-5 grid gap-2">
            <AppButton asChild>
              <Link href={ROUTES.customer.checkout}>Book sekarang</Link>
            </AppButton>
            <AppButton variant="secondary">
              <MessageCircle size={16} /> Chat vendor
            </AppButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
export function ProductDetail() {
  const product = productRepository.list()[0];
  // TODO API: Ambil detail product/package berdasarkan product_id
  return (
    <Page title={product.name} description={product.description}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <div className="relative h-80 overflow-hidden rounded-[2rem]">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div className="relative h-20 overflow-hidden rounded-xl" key={item}>
                <Image src={product.image} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
          <DetailGrid
            items={[
              ["Vendor", marketplaceRepository.vendors()[0].name],
              ["Kategori", product.category],
              ["Kapasitas", `${product.guestCapacity} tamu`],
              ["Durasi", product.duration],
              ["Area layanan", product.serviceArea],
              ["Minimum DP", formatCurrency(product.minimumDp)],
            ]}
          />
          <Accordion
            items={[
              { title: "Deskripsi layanan", content: product.description },
              {
                title: "Fasilitas yang termasuk",
                content: "Tim profesional, konsultasi konsep, instalasi, dan dokumentasi proses.",
              },
              {
                title: "Syarat dan ketentuan",
                content: "Jadwal dan revisi mengikuti kesepakatan tertulis dengan vendor.",
              },
              {
                title: "Kebijakan pembatalan",
                content: "Pembatalan dan refund mengikuti waktu pembatalan serta ketentuan vendor.",
              },
            ]}
          />
          <ReviewList />
        </div>
        <aside className="h-fit lg:sticky lg:top-24">
          <PriceBreakdown subtotal={product.price} />
          <AppButton asChild className="mt-3 w-full">
            <Link href={ROUTES.customer.checkout}>Booking sekarang</Link>
          </AppButton>
        </aside>
      </div>
    </Page>
  );
}
export function CheckoutPage() {
  // TODO API: Kirim data checkout ke backend untuk membuat order
  return (
    <Page title="Konfirmasi Booking" description="Periksa detail acara sebelum membuat pesanan.">
      <Stepper steps={["Detail Acara", "Ringkasan Paket", "Pembayaran"]} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <EntityForm fields={checkoutFields} submitLabel="Lanjutkan ke pembayaran" />
        <aside className="h-fit rounded-3xl border bg-white p-5 shadow-soft lg:sticky lg:top-24">
          <div className="flex gap-3">
            <div className="relative size-16 overflow-hidden rounded-xl">
              <Image src={productRepository.list()[0].image} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="text-xs text-stone-400">{marketplaceRepository.vendors()[0].name}</p>
              <h3 className="text-sm font-semibold">{productRepository.list()[0].name}</h3>
            </div>
          </div>
          <div className="mt-5">
            <PriceBreakdown subtotal={productRepository.list()[0].price} fee={250000} />
          </div>
        </aside>
      </div>
    </Page>
  );
}
export function PaymentPage() {
  // TODO API: Ambil detail payment instruction dan update countdown berdasarkan expired_at dari backend
  // TODO API: Upload bukti pembayaran ke backend/storage
  return (
    <Page title="Instruksi Pembayaran" description="Selesaikan pembayaran sebelum batas waktu.">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Selesaikan pembayaran dalam <strong>23:45:18</strong> agar pesanan tidak kedaluwarsa.
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">Total pembayaran</span>
            <StatusBadge status={orderRepository.list()[1].paymentStatus} />
          </div>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(25000000)}</p>
          <div className="mt-6 rounded-2xl bg-stone-50 p-5">
            <p className="text-xs text-stone-400">Transfer ke Bank BCA</p>
            <p className="mt-2 text-xl font-semibold">1234 5678 901</p>
            <p className="text-sm text-stone-500">a.n. Plan Your Wedding</p>
            <AppButton className="mt-4" variant="secondary">
              <Copy size={15} /> Salin nomor rekening
            </AppButton>
          </div>
        </section>
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <SectionHeader
            title="Upload bukti pembayaran"
            description="Pastikan nominal dan informasi transfer terlihat jelas."
          />
          <div className="mt-5">
            <DragDropUpload />
          </div>
          <AppButton className="mt-5 w-full">Kirim bukti pembayaran</AppButton>
        </section>
      </div>
    </Page>
  );
}
