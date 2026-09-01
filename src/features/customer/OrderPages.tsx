"use client";

import { PaymentProof } from "@/features/orders/components/PaymentProof";
import { getPaymentSummary, PaymentStagesCompact, PaymentSummary } from "@/features/orders/components/PaymentSummary";
import { completeOrder, createRemainingPayment, getOrder, getOrdersWithPayments, submitPaymentProof } from "@/features/orders/repository";
import { getCurrentPayment, paymentInstallmentLabel, sortPaymentsByInstallment, validatePaymentProof } from "@/features/orders/rules";
import { buildOrderTimeline } from "@/features/orders/timeline";
import type { Order, OrderPayment } from "@/features/orders/types";
import { createVendorProductReview, getReviewForOrder, getVendorProductReviews, type VendorProductReview } from "@/features/reviews/api";
import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { OrderTimeline } from "@/shared/components/data-display/Commerce";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { DetailGrid } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { usePopup } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppTextarea } from "@/shared/components/ui/FormFields";
import { MultiImageUpload } from "@/shared/components/ui/MultiImageUpload";
import { ROUTES } from "@/shared/config/routes";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { usePaginatedResource } from "@/shared/hooks/usePaginatedResource";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";

function Page({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <FeaturePage title={title} description={description} showHeader={false}>{children}</FeaturePage>;
}

export function Orders() {
  const loader = useCallback((query: { filter?: string; pageNumber?: number; pageSize?: number }) => getOrdersWithPayments(query), []);
  const orders = usePaginatedResource(loader, { pageSize: 10 });
  if (orders.loading && !orders.data.length) return <LoadingSkeleton />;
  if (orders.error) return <ErrorState retry={() => void orders.reload()} />;
  if (!orders.data.length) return <EmptyState title="Belum ada pesanan" description="Pesanan yang Anda buat dari marketplace akan muncul di sini." />;
  return (
    <Page title="Pesanan Saya" description="Pantau status booking dan pembayaran vendor.">
      <DataTable
        title="Pesanan terbaru" itemLabel="pesanan" total={orders.total} page={orders.page} pageSize={10}
        searchValue={orders.search} onSearchChange={orders.changeSearch} onPageChange={orders.setPage} showPagination
        columns={["Nomor", "Vendor", "Paket", "Tanggal acara", "Total", "Pembayaran", "Status", "Aksi"]}
        rows={orders.data.map((order) => [
          order.orderNumber, order.vendor.businessName, order.productName, formatDate(order.eventDate),
          formatCurrency(order.totalAmount), <PaymentStagesCompact key="payment" payments={order.payments} />, <StatusBadge key="status" status={order.status} />,
          <Link className="font-semibold text-blush" href={ROUTES.customer.order(order.id)} key="detail">Detail</Link>,
        ])}
      />
    </Page>
  );
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const action = useAsyncAction();
  const popup = usePopup();
  async function completeCurrentOrder() {
    const confirmation = await popup.confirm({
      title: "Konfirmasi pesanan selesai?",
      message: "Pastikan seluruh layanan telah diterima dengan baik. Tindakan ini menyelesaikan pesanan.",
      confirmLabel: "Selesaikan pesanan",
      variant: "success",
    });
    if (!confirmation.confirmed) return;
    const result = await action.run(() => completeOrder(orderId), {
      successMessage: "Pesanan berhasil diselesaikan.",
    });
    if (result.success) await resource.reload();
  }
  async function createSettlement() {
    const result = await action.run(() => createRemainingPayment(orderId), {
      successMessage: "Tagihan pelunasan berhasil dibuat.",
    });
    if (result.success) await resource.reload();
  }
  const loader = useCallback(() => getOrder(orderId), [orderId]);
  const resource = useAsyncResource<Order | null>(loader, { initialData: null });
  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <OrderAccessError error={resource.error} retry={resource.reload} />;
  const order = resource.data;
  if (!order) return <ErrorState retry={() => void resource.reload()} />;
  const payment = getCurrentPayment(order.payments);
  const paymentSummary = getPaymentSummary(order);
  const remainingPayment = order.payments?.find((item) => item.installment === "REMAINING");
  async function uploadAgain(paymentId: string, file: File) {
    const validationError = validatePaymentProof(file);
    if (validationError) {
      popup.error(validationError);
      return;
    }
    const result = await action.run(() => submitPaymentProof(paymentId, file), {
      successMessage: "Bukti pembayaran berhasil diunggah ulang.",
    });
    if (result.success) await resource.reload();
  }
  return (
    <Page title={`Pesanan ${order.orderNumber}`} description="Detail acara, pembayaran, dan perkembangan pesanan.">
      {order.rejectReason && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Pesanan ditolak:</strong> {order.rejectReason}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailGrid items={[
          ["Vendor", order.vendor.businessName], ["Paket", order.productName], ["Tanggal acara", formatDate(order.eventDate)],
          ["Lokasi", order.eventLocation], ["Jumlah tamu", order.guestCount ? `${order.guestCount} tamu` : "-"],
          ["Total", formatCurrency(order.totalAmount)], ["Status pesanan", <StatusBadge key="order" status={order.status} />],
          ["Pembayaran", payment ? <StatusBadge key="payment" status={payment.status} /> : "-"],
        ]} />
        <section className="rounded-3xl border bg-white p-6"><SectionHeader title="Timeline pesanan" /><div className="mt-5"><OrderTimeline items={buildOrderTimeline(order)} /></div></section>
      </div>
      <PaymentSummary order={order} />
      {!!order.payments?.length && (
        <section className="grid gap-4">
          <SectionHeader title="Bukti pembayaran per tahap" description="Anda dapat melihat kembali bukti DP, pembayaran penuh, maupun pelunasan yang pernah dikirim." />
          {sortPaymentsByInstallment(order.payments).map((item) => (
            <CustomerPaymentPanel
              key={item.id}
              loading={action.loading}
              onUpload={(file) => void uploadAgain(item.id, file)}
              payment={item}
            />
          ))}
        </section>
      )}
      {order.status === "WAITING_CUSTOMER_CONFIRMATION" && (
        <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Konfirmasi layanan</h2>
          <p className="mt-1 text-sm text-stone-500">Vendor telah menandai layanan selesai. Periksa hasilnya sebelum menyelesaikan pesanan.</p>
          {!paymentSummary.isFullyPaid && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Lunasi sisa tagihan {formatCurrency(paymentSummary.remainingAmount)} sebelum menyelesaikan pesanan.</p>
              {!remainingPayment ? (
                <AppButton className="mt-4" loading={action.loading} onClick={() => void createSettlement()}>
                  Buat tagihan pelunasan
                </AppButton>
              ) : remainingPayment.status === "WAITING_PAYMENT" || remainingPayment.status === "REJECTED" ? (
                <AppButton asChild className="mt-4"><Link href={ROUTES.customer.payment(order.id)}>Bayar pelunasan</Link></AppButton>
              ) : remainingPayment.status === "WAITING_VERIFICATION" ? (
                <p className="mt-3">Bukti pelunasan sedang menunggu verifikasi vendor.</p>
              ) : null}
            </div>
          )}
          <AppButton className="mt-5" disabled={!paymentSummary.isFullyPaid} loading={action.loading} onClick={() => void completeCurrentOrder()}>
            Konfirmasi pesanan selesai
          </AppButton>
        </section>
      )}
      {order.status === "COMPLETED" && (
        <CustomerReviewSection order={order} />
      )}
      {order.status === "PENDING_PAYMENT" && payment?.status === "WAITING_PAYMENT" && <Link className="font-semibold text-blush" href={ROUTES.customer.payment(order.id)}>Lanjutkan pembayaran →</Link>}
    </Page>
  );
}

export function ReviewPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const action = useAsyncAction();
  const loader = useCallback(async () => {
    const order = await getOrder(orderId);
    return { order, review: await getReviewForOrder(order) };
  }, [orderId]);
  const resource = useAsyncResource<{ order: Order; review: VendorProductReview | null } | null>(loader, { initialData: null });

  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <OrderAccessError error={resource.error} retry={resource.reload} />;
  const data = resource.data;
  if (!data) return <ErrorState retry={() => void resource.reload()} />;
  const { order, review } = data;
  if (order.status !== "COMPLETED") {
    return <EmptyState title="Ulasan belum tersedia" description="Ulasan baru dapat dibuat setelah pesanan selesai." />;
  }
  if (review) {
    return <Page title="Ulasan Anda" description="Pesanan ini sudah pernah Anda ulas."><ReviewCard review={review} /></Page>;
  }

  return (
    <Page title={`Ulas ${order.productName}`} description={`Bagikan pengalaman Anda bersama ${order.vendor.businessName}.`}>
      <ReviewForm
        loading={action.loading}
        onSubmit={async (form) => {
          const result = await action.run(() => createVendorProductReview(orderId, form), {
            successMessage: "Ulasan berhasil dikirim.",
          });
          if (result.success) router.replace(ROUTES.customer.order(orderId));
        }}
      />
    </Page>
  );
}

function CustomerReviewSection({ order }: { order: Order }) {
  const loader = useCallback(() => getReviewForOrder(order), [order.id, order.customer.id, order.vendorProduct.id]);
  const review = useAsyncResource<VendorProductReview | null>(loader, { initialData: null });

  if (review.loading) return <div className="h-36 animate-pulse rounded-3xl bg-stone-100" />;
  if (review.error) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <h2 className="font-semibold text-amber-900">Pesanan telah selesai</h2>
        <p className="mt-1 text-sm text-amber-700">Status ulasan belum dapat diperiksa.</p>
        <AppButton className="mt-4" onClick={() => void review.reload()} variant="secondary">Coba lagi</AppButton>
      </section>
    );
  }
  if (review.data) return <ReviewCard review={review.data} />;

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
      <h2 className="font-semibold text-emerald-900">Pesanan telah selesai</h2>
      <p className="mt-1 text-sm text-emerald-700">Bagikan pengalaman Anda untuk membantu customer lain memilih vendor.</p>
      <AppButton asChild className="mt-4"><Link href={ROUTES.customer.review(order.id)}>Beri ulasan</Link></AppButton>
    </section>
  );
}

function ReviewCard({ review }: { review: VendorProductReview }) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Ulasan Anda</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Terima kasih sudah berbagi pengalaman</h2>
        </div>
        <div aria-label={`${review.rating} dari 5 bintang`} className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star className={value <= review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"} key={value} size={22} />
          ))}
        </div>
      </div>
      {review.comment && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-stone-700">{review.comment}</p>}
      {!!review.imageAttachmentIds.length && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {review.imageAttachmentIds.map((id) => <ReviewPhoto attachmentId={id} key={id} />)}
        </div>
      )}
      <p className="mt-5 text-xs text-stone-500">Ulasan telah dikirim dan tidak dapat dikirim ulang untuk pesanan ini.</p>
    </section>
  );
}

function ReviewPhoto({ attachmentId }: { attachmentId: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    void getAttachmentBlob(attachmentId).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => setUrl(""));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId]);

  if (!url) return <div className="aspect-square animate-pulse rounded-2xl bg-stone-100" />;
  return <a href={url} rel="noreferrer" target="_blank"><img alt="Foto ulasan Anda" className="aspect-square w-full rounded-2xl border object-cover transition hover:opacity-90" src={url} /></a>;
}

const REVIEW_TAGS = [
  "Pelayanan ramah",
  "Tepat waktu",
  "Hasil sesuai pesanan",
  "Komunikasi baik",
  "Harga sesuai kualitas",
  "Sangat direkomendasikan",
];

const RATING_LABELS = ["", "Sangat kurang", "Kurang", "Cukup", "Puas", "Sangat puas"];

function ReviewForm({ loading, onSubmit }: { loading: boolean; onSubmit: (form: HTMLFormElement) => void | Promise<void> }) {
  const popup = usePopup();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const visibleRating = hoveredRating || rating;
  const combinedComment = [selectedTags.join(" • "), comment.trim()].filter(Boolean).join("\n");

  function toggleTag(tag: string) {
    setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) {
      popup.warning("Pilih rating bintang terlebih dahulu.");
      return;
    }
    void onSubmit(event.currentTarget);
  }

  return (
    <form className="grid gap-7 rounded-3xl border bg-white p-5 shadow-sm sm:p-8" onSubmit={submit}>
      <section className="text-center">
        <h2 className="text-lg font-semibold text-ink">Bagaimana pengalaman Anda?</h2>
        <p className="mt-1 text-sm text-stone-500">Ketuk bintang untuk memberikan penilaian.</p>
        <input name="rating" type="hidden" value={rating} />
        <div className="mt-5 flex justify-center gap-2" onMouseLeave={() => setHoveredRating(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              aria-label={`${value} bintang — ${RATING_LABELS[value]}`}
              className="rounded-full p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
              key={value}
              onClick={() => setRating(value)}
              onFocus={() => setHoveredRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              type="button"
            >
              <Star className={value <= visibleRating ? "fill-amber-400 text-amber-400" : "text-stone-300"} size={42} />
            </button>
          ))}
        </div>
        <p className="mt-2 min-h-5 text-sm font-semibold text-amber-600">{RATING_LABELS[visibleRating]}</p>
      </section>

      <section className="border-t pt-6">
        <h3 className="font-semibold text-ink">Apa yang paling berkesan?</h3>
        <p className="mt-1 text-sm text-stone-500">Pilih satu atau beberapa. Pilihan ini akan ikut tersimpan dalam ulasan.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {REVIEW_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <button
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selected ? "border-blush bg-rose-50 text-blush" : "border-stone-200 bg-white text-stone-600 hover:border-rose-200"}`}
                key={tag}
                onClick={() => toggleTag(tag)}
                type="button"
              >
                {selected ? "✓ " : "+ "}{tag}
              </button>
            );
          })}
        </div>
      </section>

      <input name="comment" type="hidden" value={combinedComment} />
      <AppTextarea
        helper="Ceritakan kualitas hasil, komunikasi vendor, atau hal lain yang membantu customer berikutnya."
        label="Tulis ulasan"
        maxLength={1000}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Contoh: Vendor responsif, datang tepat waktu, dan hasil dekorasinya sesuai ekspektasi."
        value={comment}
      />

      <MultiImageUpload
        helper="Tambahkan maksimal 5 foto hasil layanan. JPG, PNG, atau WebP maksimal 5 MB per foto."
        label="Tambahkan foto (opsional)"
        maxFiles={5}
        name="images"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-xs text-stone-500">Ulasan hanya dapat dikirim satu kali untuk pesanan ini.</p>
        <AppButton disabled={!rating} loading={loading} type="submit">Kirim ulasan</AppButton>
      </div>
    </form>
  );
}

function CustomerPaymentPanel({
  loading,
  onUpload,
  payment,
}: {
  loading: boolean;
  onUpload: (file: File) => void;
  payment: OrderPayment;
}) {
  const [file, setFile] = useState<File | null>(null);
  const canUploadAgain = payment.status === "REJECTED";

  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Bukti pembayaran Anda</h2>
          <p className="mt-1 text-sm text-stone-500">
            {paymentInstallmentLabel(payment.installment)} sebesar {formatCurrency(payment.amount)}
          </p>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      {payment.rejectReason && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Bukti ditolak:</strong> {payment.rejectReason}
        </p>
      )}

      <div className="mt-5">
        {payment.proofAttachmentId ? (
          <PaymentProof attachmentId={payment.proofAttachmentId} />
        ) : (
          <p className="rounded-2xl bg-stone-50 p-5 text-sm text-stone-500">
            Bukti pembayaran belum diunggah.
          </p>
        )}
      </div>

      {canUploadAgain && (
        <div className="mt-5 border-t pt-5">
          <h3 className="font-semibold text-ink">Upload ulang bukti</h3>
          <p className="mt-1 text-sm text-stone-500">
            Perbaiki bukti sesuai alasan penolakan vendor. File sebelumnya akan diganti.
          </p>
          <label className="mt-4 grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed bg-stone-50 p-6 text-center hover:border-blush hover:bg-rose-50">
            <input
              accept=".jpg,.jpeg,.png,.pdf"
              className="sr-only"
              disabled={loading}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span className="text-sm font-semibold">{file?.name ?? "Pilih bukti pembayaran baru"}</span>
            <span className="mt-1 text-xs text-stone-500">JPG, PNG, atau PDF maksimal 5 MB</span>
          </label>
          <AppButton
            className="mt-4"
            disabled={!file}
            loading={loading}
            onClick={() => file && onUpload(file)}
          >
            Upload ulang bukti
          </AppButton>
        </div>
      )}
    </section>
  );
}

function OrderAccessError({ error, retry }: { error: string; retry: () => Promise<unknown> }) {
  const forbidden = /tidak berhak|akses|forbidden/i.test(error);
  const missing = /not found|tidak ditemukan/i.test(error);
  if (forbidden || missing) return <EmptyState title={forbidden ? "Anda tidak memiliki akses" : "Order tidak ditemukan"} description={forbidden ? "Order ini bukan milik akun Anda." : "Order mungkin sudah tidak tersedia."} />;
  return <ErrorState retry={() => void retry()} />;
}

export function ReviewList() {
  const loader = useCallback(() => getVendorProductReviews({ pageNumber: 1, pageSize: 20 }), []);
  const reviews = useAsyncResource(loader, { initialData: null });
  if (reviews.loading) return <LoadingSkeleton />;
  if (reviews.error) return <ErrorState retry={() => void reviews.reload()} />;
  if (!reviews.data?.data.length) return <EmptyState title="Belum ada ulasan" description="Ulasan customer akan tampil setelah pesanan selesai." />;
  return (
    <section className="grid gap-4">
      <SectionHeader title="Ulasan customer" description={`${reviews.data.total} pengalaman customer terverifikasi.`} />
      {reviews.data.data.map((review) => (
        <article className="rounded-2xl border bg-white p-5" key={review.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-semibold text-ink">{review.customer?.fullName ?? "Customer"}</p><p className="text-xs text-stone-500">{review.vendorProduct?.name ?? review.order?.orderNumber ?? "Pembelian terverifikasi"}</p></div>
            <div aria-label={`${review.rating} dari 5 bintang`} className="flex">{[1, 2, 3, 4, 5].map((value) => <Star className={value <= review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"} key={value} size={17} />)}</div>
          </div>
          {review.comment && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700">{review.comment}</p>}
          {!!review.imageAttachmentIds.length && <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{review.imageAttachmentIds.map((id) => <ReviewPhoto attachmentId={id} key={id} />)}</div>}
        </article>
      ))}
    </section>
  );
}
