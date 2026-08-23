"use client";

import { ReviewList } from "@/features/customer/OrderPages";
import { marketplaceRepository } from "@/features/marketplace/repository";
import { orderRepository } from "@/features/orders/repository";
import { productRepository } from "@/features/products/repository";
import { getVendorProduct } from "@/features/products/api";
import type { VendorProduct } from "@/features/products/types";
import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { ProductCard } from "@/shared/components/data-display/Cards";
import { PriceBreakdown } from "@/shared/components/data-display/Commerce";
import { DetailGrid, PlaceholderPanel } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
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
import { ChevronLeft, ChevronRight, Copy, Heart, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

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
export function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await getVendorProduct(productId);
      if (result.status !== "ACTIVE" || !result.active) {
        throw new Error("Produk ini sedang tidak tersedia.");
      }
      setProduct(result);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Produk gagal dimuat.");
    }
  }, [productId]);
  useEffect(() => void load(), [load]);
  if (error)
    return (
      <Page title="Detail Produk" description="Produk tidak dapat ditampilkan.">
        <ErrorState retry={() => void load()} />
      </Page>
    );
  if (!product) return <LoadingSkeleton />;
  const detailItems = [
    product.description ? { title: "Deskripsi layanan", content: product.description } : null,
    product.terms ? { title: "Syarat dan ketentuan", content: product.terms } : null,
  ].filter((item): item is { title: string; content: string } => Boolean(item));
  return (
    <Page title={product.name} description={product.description ?? "Detail paket layanan vendor."}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <ProductGallery attachmentIds={product.imageAttachmentIds} name={product.name} />
          <DetailGrid
            items={[
              ["Vendor", product.vendor.businessName],
              ["Kategori", product.category ?? "-"],
              ["Kapasitas", product.guestCapacity ? `${product.guestCapacity} tamu` : "-"],
              ["Durasi", product.duration ?? "-"],
              ["Area layanan", product.serviceArea ?? "-"],
              ["Minimum DP", formatCurrency(product.minimumDp ?? 0)],
            ]}
          />
          {detailItems.length > 0 && <Accordion items={detailItems} />}
          <ProductReviewEmptyState />
        </div>
        <aside className="h-fit rounded-3xl border bg-white p-5 shadow-soft lg:sticky lg:top-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-blush">
            {product.category ?? "Layanan wedding"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-ink">{product.name}</h1>
          <p className="mt-2 text-sm text-stone-500">oleh {product.vendor.businessName}</p>
          {product.description && (
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">
              {product.description}
            </p>
          )}
          <div className="mt-5 border-t pt-5">
            <PriceBreakdown subtotal={product.price} />
          </div>
          <AppButton asChild className="mt-3 w-full">
            <Link href={ROUTES.customer.checkout}>Booking sekarang</Link>
          </AppButton>
        </aside>
      </div>
    </Page>
  );
}

function ProductGallery({ attachmentIds, name }: { attachmentIds: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  useEffect(() => setActiveIndex(0), [attachmentIds]);
  const hasMultipleImages = attachmentIds.length > 1;
  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? attachmentIds.length - 1 : current - 1));
  }
  function showNext() {
    setActiveIndex((current) => (current + 1) % attachmentIds.length);
  }
  function finishSwipe(clientX: number) {
    if (touchStartX.current === null || !hasMultipleImages) return;
    const distance = clientX - touchStartX.current;
    if (Math.abs(distance) >= 45) distance > 0 ? showPrevious() : showNext();
    touchStartX.current = null;
  }

  if (attachmentIds.length === 0) {
    return (
      <CustomerProductImage attachmentId={undefined} className="h-80 rounded-[2rem]" name={name} />
    );
  }
  return (
    <div className="grid gap-3">
      <div
        className="group relative"
        onTouchEnd={(event) => finishSwipe(event.changedTouches[0]?.clientX ?? 0)}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
      >
        <CustomerProductImage
          attachmentId={attachmentIds[activeIndex]}
          className="h-64 rounded-3xl sm:h-80 lg:h-[380px]"
          name={`${name} - foto ${activeIndex + 1}`}
        />
        {hasMultipleImages && (
          <>
            <GalleryNavigationButton direction="previous" onClick={showPrevious} />
            <GalleryNavigationButton direction="next" onClick={showNext} />
            <span className="absolute bottom-4 right-4 rounded-full bg-ink/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {activeIndex + 1}/{attachmentIds.length}
            </span>
          </>
        )}
      </div>
      {hasMultipleImages && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {attachmentIds.map((id, index) => (
            <button
              aria-label={`Tampilkan foto ${index + 1}`}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-18 sm:w-24 ${activeIndex === index ? "border-blush ring-2 ring-rose-100" : "border-transparent opacity-70 hover:opacity-100"}`}
              key={id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <CustomerProductImage attachmentId={id} className="size-full" name={name} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryNavigationButton({
  direction,
  onClick,
}: {
  direction: "previous" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={direction === "previous" ? "Foto sebelumnya" : "Foto berikutnya"}
      className={`absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-90 shadow-lg backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 ${direction === "previous" ? "left-3" : "right-3"}`}
      onClick={onClick}
      type="button"
    >
      <Icon size={20} />
    </button>
  );
}

function ProductReviewEmptyState() {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-ink">Ulasan customer</h2>
      <div className="mt-4 rounded-2xl bg-stone-50 px-5 py-7 text-center">
        <p className="text-sm font-medium text-stone-700">Belum ada ulasan</p>
        <p className="mt-1 text-xs text-stone-500">
          Ulasan akan tampil setelah customer menyelesaikan pesanan.
        </p>
      </div>
    </section>
  );
}

function CustomerProductImage({
  attachmentId,
  className,
  name,
}: {
  attachmentId?: string;
  className: string;
  name: string;
}) {
  const load = useCallback(
    () => (attachmentId ? getAttachmentBlob(attachmentId) : Promise.resolve(null)),
    [attachmentId],
  );
  const image = useImageUpload({
    enabled: Boolean(attachmentId),
    load,
    loadErrorMessage: "Gambar produk gagal dimuat.",
  });
  return (
    <div className={`grid place-items-center overflow-hidden bg-stone-100 ${className}`}>
      {image.previewUrl ? (
        <img alt={name} className="size-full object-cover" src={image.previewUrl} />
      ) : (
        <span className="text-xs text-stone-400">Belum ada gambar</span>
      )}
    </div>
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
