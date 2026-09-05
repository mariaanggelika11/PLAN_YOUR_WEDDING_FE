"use client";

import { ReviewList } from "@/features/customer/OrderPages";
import { createOrder, getOrder, submitPaymentProof } from "@/features/orders/repository";
import { canSubmitPaymentProof, getCurrentPayment, paymentInstallmentLabel, validatePaymentProof } from "@/features/orders/rules";
import type { Order } from "@/features/orders/types";
import { marketplaceRepository } from "@/features/marketplace/repository";
import { productRepository } from "@/features/products/repository";
import { getVendorProduct } from "@/features/products/api";
import type { VendorProduct } from "@/features/products/types";
import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { ProductReviews } from "@/features/reviews/components/ProductReviews";
import { useProfileData } from "@/features/profile/context/ProfileProvider";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { ProductCard } from "@/shared/components/data-display/Cards";
import { PriceBreakdown } from "@/shared/components/data-display/Commerce";
import { DetailGrid, PlaceholderPanel } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { usePopup } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { EntityForm, type FormField } from "@/shared/components/forms/EntityForm";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { Accordion, Tabs } from "@/shared/components/navigation/Interactive";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";
import { ChevronLeft, ChevronRight, Copy, Heart, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  { label: "Catatan untuk vendor", name: "notes", type: "textarea", required: true },
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
              <Link href={ROUTES.customer.checkout(productRepository.list()[0].id)}>
                Book sekarang
              </Link>
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
export function ProductDetail({ canBook = true, productId }: { canBook?: boolean; productId: string }) {
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
          <ProductReviews key={product.id} product={product} />
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
          {canBook ? <AppButton asChild className="mt-3 w-full"><Link href={ROUTES.customer.checkout(product.id)}>Booking sekarang</Link></AppButton> : <p className="mt-3 rounded-xl bg-blue-50 p-3 text-center text-sm text-blue-700">Mode lihat marketplace vendor</p>}
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

function PaymentTypeCards({
  minimumDp,
  onChange,
  price,
  value,
}: {
  minimumDp: number;
  onChange: (value: "DP" | "FULL") => void;
  price: number;
  value: "DP" | "FULL" | "";
}) {
  const choices = [
    {
      description: "Minimum untuk mengamankan pesanan",
      label: "Bayar DP",
      type: "DP" as const,
      amount: minimumDp,
    },
    {
      description: "Selesaikan seluruh pembayaran",
      label: "Bayar lunas",
      type: "FULL" as const,
      amount: price,
    },
  ];

  return (
    <fieldset className="rounded-3xl border bg-white p-5 shadow-sm sm:p-7">
      <legend className="sr-only">Pilih pembayaran</legend>
      <h2 className="text-xl font-semibold text-ink">Pilih pembayaran</h2>
      <p className="mt-1 text-sm text-stone-500">
        Pilih pembayaran DP minimum atau langsung lunas untuk melanjutkan.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {choices.map((choice) => {
          const selected = value === choice.type;
          return (
            <label
              className={`relative cursor-pointer rounded-2xl border p-5 transition focus-within:ring-4 focus-within:ring-rose-100 ${selected ? "border-blush bg-rose-50 ring-2 ring-rose-100" : "bg-white hover:border-rose-300"}`}
              key={choice.type}
            >
              <input
                checked={selected}
                className="sr-only"
                name="paymentType"
                onChange={() => onChange(choice.type)}
                required
                type="radio"
                value={choice.type}
              />
              <span className="block text-sm font-semibold text-ink">{choice.label}</span>
              <strong className="mt-3 block text-xl text-ink">{formatCurrency(choice.amount)}</strong>
              <span className="mt-1 block text-xs text-stone-500">{choice.description}</span>
            </label>
          );
        })}
      </div>
      {!value && <p className="mt-3 text-xs font-medium text-amber-700">Pilih salah satu metode pembayaran.</p>}
    </fieldset>
  );
}

export function CheckoutPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [error, setError] = useState("");
  const customer = useProfileData("customer");
  const router = useRouter();
  const action = useAsyncAction();
  const [paymentType, setPaymentType] = useState<"DP" | "FULL" | "">("");
  const loadProduct = useCallback(async () => {
    try {
      const result = await getVendorProduct(productId);
      if (!result.active || result.status !== "ACTIVE") {
        throw new Error("Produk ini sedang tidak menerima pesanan.");
      }
      setProduct(result);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Produk gagal dimuat.");
    }
  }, [productId]);
  useEffect(() => void loadProduct(), [loadProduct]);

  if (error) return <ErrorState retry={() => void loadProduct()} />;
  if (!product || customer.loading) return <LoadingSkeleton />;

  const profile = customer.data;
  const initialValues = {
    date: profile?.weddingDate?.slice(0, 10) ?? "",
    location:
      profile?.weddingLocation?.trim() ||
      [profile?.weddingCity, profile?.weddingProvince].filter(Boolean).join(", "),
    guests: profile?.estimatedGuests ?? "",
    notes: "",
  };
  const filledFromProfile = Boolean(
    initialValues.date || initialValues.location || initialValues.guests,
  );

  return (
    <Page title="Checkout" description="Lengkapi detail acara untuk membuat pesanan.">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
        <span className="rounded-full bg-blush px-3 py-1.5 text-white">
          1 · Detail & konfirmasi
        </span>
        <span aria-hidden="true">—</span>
        <span className="rounded-full bg-stone-100 px-3 py-1.5">2 · Pembayaran</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-3">
          {filledFromProfile ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div>
                <p className="font-semibold">Detail acara diisi dari Profil Wedding</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Perubahan di sini hanya berlaku untuk pesanan ini.
                </p>
              </div>
              <Link className="text-xs font-semibold underline" href={ROUTES.customer.profile}>
                Edit profil
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Isi detail acara di bawah. Anda juga dapat melengkapinya sekali di{" "}
              <Link className="font-semibold underline" href={ROUTES.customer.profile}>
                Profil Wedding
              </Link>{" "}
              agar checkout berikutnya lebih cepat.
            </div>
          )}
          {customer.error && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              Profil tidak berhasil dimuat. Anda tetap dapat mengisi detail acara secara manual.
            </p>
          )}
          <EntityForm
            fields={checkoutFields}
            initialValues={initialValues}
            note="Pastikan tanggal, lokasi, dan jumlah tamu sesuai kebutuhan vendor."
            showDraft={false}
            loading={action.loading}
            submitLabel="Buat pesanan & lanjut pembayaran"
            onSave={async (form) => {
              const values = new FormData(form);
              const guestCount = Number(values.get("guests"));
              const result = await action.run(() => createOrder({
                vendorProductId: Number(productId),
                eventDate: String(values.get("date") ?? ""),
                eventLocation: String(values.get("location") ?? "").trim(),
                ...(Number.isInteger(guestCount) && guestCount > 0 ? { guestCount } : {}),
                notes: String(values.get("notes") ?? "").trim(),
                paymentType: values.get("paymentType") === "FULL" ? "FULL" : "DP",
              }), { successMessage: "Pesanan berhasil dibuat." });
              if (result.success) router.push(ROUTES.customer.payment(result.data.id));
            }}
          >
            <PaymentTypeCards
              minimumDp={product.minimumDp && product.minimumDp > 0 ? product.minimumDp : product.price}
              onChange={setPaymentType}
              price={product.price}
              value={paymentType}
            />
          </EntityForm>
          <p className="px-2 text-center text-xs leading-5 text-stone-500">
            Anda belum dikenakan pembayaran pada tahap ini. Pesanan dibuat terlebih dahulu sebelum
            instruksi pembayaran ditampilkan.
          </p>
        </div>
        <aside className="order-first h-fit rounded-3xl border bg-white p-5 shadow-soft lg:order-none lg:sticky lg:top-24">
          <p className="mb-4 text-sm font-semibold text-ink">Ringkasan pesanan</p>
          <div className="flex gap-3">
            <CustomerProductImage
              attachmentId={product.imageAttachmentIds[0]}
              className="size-16 shrink-0 rounded-xl"
              name={product.name}
            />
            <div>
              <p className="text-xs text-stone-400">{product.vendor.businessName}</p>
              <h3 className="mt-0.5 text-sm font-semibold">{product.name}</h3>
              {product.category && (
                <p className="mt-1 text-xs text-stone-500">{product.category}</p>
              )}
            </div>
          </div>
          <div className="mt-5 grid gap-3 border-y py-4 text-sm">
            {product.guestCapacity && (
              <div className="flex justify-between gap-3">
                <span className="text-stone-500">Kapasitas</span>
                <span>{product.guestCapacity} tamu</span>
              </div>
            )}
            {product.duration && (
              <div className="flex justify-between gap-3">
                <span className="text-stone-500">Durasi</span>
                <span>{product.duration}</span>
              </div>
            )}
            {product.minimumDp != null && (
              <div className="flex justify-between gap-3">
                <span className="text-stone-500">Minimum DP</span>
                <span>{formatCurrency(product.minimumDp)}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="text-sm text-stone-500">Harga paket</span>
            <span className="text-xl font-semibold text-ink">{formatCurrency(product.price)}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            Biaya tambahan, jika ada, harus ditampilkan dan dikonfirmasi sebelum pembayaran.
          </p>
        </aside>
      </div>
    </Page>
  );
}
export function PaymentPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const popup = usePopup();
  const action = useAsyncAction();
  const [order, setOrder] = useState<Order | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setOrder(null);
    setError("");
    try {
      setOrder(await getOrder(orderId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Detail pembayaran gagal dimuat.");
    }
  }, [orderId]);
  useEffect(() => void load(), [load]);
  if (error) {
    const forbidden = /tidak berhak|akses|forbidden/i.test(error);
    return forbidden ? <Page title="Akses ditolak" description="Order ini bukan milik akun Anda."><p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">Anda tidak memiliki akses ke pembayaran order ini.</p></Page> : <ErrorState retry={() => void load()} />;
  }
  if (!order) return <LoadingSkeleton />;
  const payment = getCurrentPayment(order.payments);
  if (!payment) return <Page title="Pembayaran" description="Instruksi pembayaran belum tersedia."><p className="rounded-2xl bg-amber-50 p-5 text-amber-800">Backend belum membuat installment pembayaran untuk order ini.</p></Page>;
  const canUpload = canSubmitPaymentProof(payment);
  async function uploadProof() {
    if (!file) { popup.warning("Pilih file bukti pembayaran terlebih dahulu."); return; }
    const validationError = validatePaymentProof(file);
    if (validationError) { popup.error(validationError); return; }
    const result = await action.run(() => submitPaymentProof(payment!.id, file), { successMessage: "Bukti pembayaran berhasil dikirim." });
    if (result.success) router.replace(ROUTES.customer.order(orderId));
  }
  return <Page title={`Pembayaran ${order.orderNumber}`} description="Transfer sesuai instruksi rekening yang dikunci saat order dibuat.">
    {payment.rejectReason && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Bukti sebelumnya ditolak:</strong> {payment.rejectReason}</p>}
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <SectionHeader title="Instruksi pembayaran" description={`${paymentInstallmentLabel(payment.installment)} untuk order ini.`} />
        <div className="mt-5 rounded-2xl bg-stone-50 p-5"><p className="text-xs text-stone-500">Transfer ke {payment.bankName}</p><p className="mt-2 text-xl font-semibold">{payment.accountNumber}</p><p className="text-sm text-stone-500">a.n. {payment.accountHolderName}</p><AppButton className="mt-4" onClick={() => void navigator.clipboard.writeText(payment.accountNumber)} variant="secondary"><Copy size={15} /> Salin nomor rekening</AppButton></div>
        <div className="mt-5 flex items-end justify-between"><span className="text-stone-500">Nominal transfer</span><strong className="text-2xl">{formatCurrency(payment.amount)}</strong></div>
        <div className="mt-6 border-t pt-6"><label className="grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed bg-stone-50 p-8 text-center"><input className="sr-only" type="file" accept=".jpg,.jpeg,.png,.pdf" disabled={!canUpload} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><span className="text-sm font-semibold">{file?.name ?? "Klik untuk memilih bukti pembayaran"}</span><span className="mt-1 text-xs text-stone-500">JPG, PNG, atau PDF maksimal 5 MB</span></label><AppButton className="mt-5 w-full" disabled={!canUpload} loading={action.loading} onClick={() => void uploadProof()}>{payment.status === "REJECTED" ? "Upload ulang bukti" : "Kirim bukti pembayaran"}</AppButton></div>
      </section>
      <aside className="h-fit rounded-3xl border bg-white p-5 shadow-soft"><p className="text-sm font-semibold">Detail order</p><DetailGrid items={[["Nomor", order.orderNumber], ["Vendor", order.vendor.businessName], ["Paket", order.productName], ["Tanggal", formatDate(order.eventDate)], ["Lokasi", order.eventLocation], ["Status pembayaran", <StatusBadge key="payment" status={payment.status} />]]} /></aside>
    </div>
  </Page>;
}
