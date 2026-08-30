"use client";

import { PaymentProof } from "@/features/orders/components/PaymentProof";
import { getPaymentSummary, PaymentSummary } from "@/features/orders/components/PaymentSummary";
import { completeOrder, getOrder, getOrdersWithPayments, submitPaymentProof } from "@/features/orders/repository";
import { validatePaymentProof } from "@/features/orders/rules";
import { buildOrderTimeline } from "@/features/orders/timeline";
import type { Order, OrderPayment } from "@/features/orders/types";
import { reviewRepository } from "@/features/reviews/repository";
import { createVendorProductReview } from "@/features/reviews/api";
import { OrderTimeline } from "@/shared/components/data-display/Commerce";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { DetailGrid } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { usePopup } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { EntityForm } from "@/shared/components/forms/EntityForm";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { usePaginatedResource } from "@/shared/hooks/usePaginatedResource";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

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
          formatCurrency(order.totalAmount), order.payments?.[0] ? <StatusBadge key="payment" status={order.payments[0].status} /> : "Belum tersedia", <StatusBadge key="status" status={order.status} />,
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
  const loader = useCallback(() => getOrder(orderId), [orderId]);
  const resource = useAsyncResource<Order | null>(loader, { initialData: null });
  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <OrderAccessError error={resource.error} retry={resource.reload} />;
  const order = resource.data;
  if (!order) return <ErrorState retry={() => void resource.reload()} />;
  const payment = order.payments?.[0];
  const paymentSummary = getPaymentSummary(order);
  async function uploadAgain(file: File) {
    if (!payment || payment.status !== "REJECTED") return;
    const validationError = validatePaymentProof(file);
    if (validationError) {
      popup.error(validationError);
      return;
    }
    const result = await action.run(() => submitPaymentProof(payment.id, file), {
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
      {payment && (
        <CustomerPaymentPanel
          loading={action.loading}
          onUpload={(file) => void uploadAgain(file)}
          payment={payment}
        />
      )}
      {order.status === "WAITING_CUSTOMER_CONFIRMATION" && (
        <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Konfirmasi layanan</h2>
          <p className="mt-1 text-sm text-stone-500">Vendor telah menandai layanan selesai. Periksa hasilnya sebelum menyelesaikan pesanan.</p>
          {!paymentSummary.isFullyPaid && (
            <p className="mt-4 text-sm font-medium text-amber-700">
              Lunasi sisa tagihan {formatCurrency(paymentSummary.remainingAmount)} sebelum menyelesaikan pesanan.
            </p>
          )}
          <AppButton className="mt-5" disabled={!paymentSummary.isFullyPaid} loading={action.loading} onClick={() => void completeCurrentOrder()}>
            Konfirmasi pesanan selesai
          </AppButton>
        </section>
      )}
      {order.status === "COMPLETED" && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <h2 className="font-semibold text-emerald-900">Pesanan telah selesai</h2>
          <p className="mt-1 text-sm text-emerald-700">Bagikan pengalaman Anda untuk membantu customer lain memilih vendor.</p>
          <AppButton asChild className="mt-4"><Link href={ROUTES.customer.review(order.id)}>Beri ulasan</Link></AppButton>
        </section>
      )}
      {order.status === "PENDING_PAYMENT" && payment?.status === "WAITING_PAYMENT" && <Link className="font-semibold text-blush" href={ROUTES.customer.payment(order.id)}>Lanjutkan pembayaran →</Link>}
    </Page>
  );
}

export function ReviewPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const action = useAsyncAction();
  const loader = useCallback(() => getOrder(orderId), [orderId]);
  const resource = useAsyncResource<Order | null>(loader, { initialData: null });

  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <OrderAccessError error={resource.error} retry={resource.reload} />;
  const order = resource.data;
  if (!order) return <ErrorState retry={() => void resource.reload()} />;
  if (order.status !== "COMPLETED") {
    return <EmptyState title="Ulasan belum tersedia" description="Ulasan baru dapat dibuat setelah pesanan selesai." />;
  }

  return (
    <Page title={`Ulas ${order.productName}`} description={`Bagikan pengalaman Anda bersama ${order.vendor.businessName}.`}>
      <EntityForm
        fields={[
          { label: "Rating (1-5)", name: "rating", type: "number", min: 1, max: 5, required: true },
          { label: "Komentar ulasan", name: "comment", type: "textarea", required: true },
          { label: "Foto ulasan (opsional)", name: "images", type: "images", multiple: true },
        ]}
        loading={action.loading}
        note="Ulasan hanya dapat dikirim satu kali untuk pesanan ini."
        onSave={async (form) => {
          const result = await action.run(() => createVendorProductReview(orderId, form), {
            successMessage: "Ulasan berhasil dikirim.",
          });
          if (result.success) router.replace(ROUTES.customer.order(orderId));
        }}
        showDraft={false}
        submitLabel="Kirim ulasan"
      />
    </Page>
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
            {payment.installment === "DP" ? "Pembayaran DP" : "Pembayaran penuh"} sebesar {formatCurrency(payment.amount)}
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
  return <section><SectionHeader title="Ulasan customer" />{reviewRepository.list().map((review) => <p className="mt-3 rounded-2xl border bg-white p-4 text-sm" key={review.id}><span className="font-semibold text-amber-500">★ {review.rating}</span><span className="mx-2 text-stone-300">·</span>{review.comment}</p>)}</section>;
}
