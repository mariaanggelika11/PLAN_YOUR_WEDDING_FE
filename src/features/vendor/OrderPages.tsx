"use client";

import {
  confirmOrder,
  getOrder,
  getOrdersWithPayments,
  rejectOrder,
  rejectPayment,
  verifyPayment,
} from "@/features/orders/repository";
import { canVendorDecide, canVendorVerifyPayment } from "@/features/orders/rules";
import { PaymentProof } from "@/features/orders/components/PaymentProof";
import type { Order, OrderPayment } from "@/features/orders/types";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { DetailGrid } from "@/shared/components/data-display/DetailBlocks";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { PopupConfirm, usePopup } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { usePaginatedResource } from "@/shared/hooks/usePaginatedResource";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";
import Link from "next/link";
import { useCallback } from "react";

export function OrdersPage() {
  const loader = useCallback(
    (query: { filter?: string; pageNumber?: number; pageSize?: number }) => getOrdersWithPayments(query),
    [],
  );
  const orders = usePaginatedResource(loader, { pageSize: 10 });

  if (orders.loading && !orders.data.length) return <LoadingSkeleton />;
  if (orders.error) return <ErrorState retry={() => void orders.reload()} />;
  if (!orders.data.length) {
    return (
      <EmptyState
        title="Belum ada pesanan masuk"
        description="Order untuk produk vendor Anda akan muncul di sini."
      />
    );
  }

  return (
    <Page title="Pesanan Vendor" description="Tinjau pesanan masuk dan status pelaksanaan.">
      <DataTable
        columns={["Nomor", "Customer", "Paket", "Tanggal", "Lokasi", "Pembayaran", "Status", "Aksi"]}
        itemLabel="pesanan"
        onPageChange={orders.setPage}
        onSearchChange={orders.changeSearch}
        page={orders.page}
        pageSize={10}
        rows={orders.data.map((order) => [
          order.orderNumber,
          order.customer.fullName,
          order.productName,
          formatDate(order.eventDate),
          order.eventLocation,
          order.payments?.[0] ? <StatusBadge key="payment" status={order.payments[0].status} /> : "Belum tersedia",
          <StatusBadge key="order" status={order.status} />,
          <Link className="font-semibold text-blush" href={ROUTES.vendor.order(order.id)} key="detail">
            Detail
          </Link>,
        ])}
        searchValue={orders.search}
        showPagination
        total={orders.total}
      />
    </Page>
  );
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const popup = usePopup();
  const action = useAsyncAction();
  const loader = useCallback(() => getOrder(orderId), [orderId]);
  const resource = useAsyncResource<Order | null>(loader, { initialData: null });

  async function acceptOrder() {
    const confirmation = await popup.confirm({
      title: "Terima pesanan?",
      message: "Pastikan tanggal dan kebutuhan customer dapat dipenuhi.",
      confirmLabel: "Terima",
      variant: "success",
    });
    if (!confirmation.confirmed) return;
    const result = await action.run(() => confirmOrder(orderId), {
      successMessage: "Pesanan berhasil diterima.",
    });
    if (result.success) await resource.reload();
  }

  async function rejectCurrentOrder(reason?: string) {
    if (!reason?.trim()) return;
    const result = await action.run(() => rejectOrder(orderId, reason), {
      successMessage: "Pesanan berhasil ditolak.",
    });
    if (result.success) await resource.reload();
  }

  async function verifyCurrentPayment(paymentId: string) {
    const confirmation = await popup.confirm({
      title: "Verifikasi pembayaran?",
      message: "Pastikan bukti, rekening tujuan, dan nominal pembayaran sudah sesuai.",
      confirmLabel: "Verifikasi",
      variant: "success",
    });
    if (!confirmation.confirmed) return;
    const result = await action.run(() => verifyPayment(paymentId), {
      successMessage: "Pembayaran berhasil diverifikasi.",
    });
    if (result.success) await resource.reload();
  }

  async function rejectCurrentPayment(paymentId: string, reason?: string) {
    if (!reason?.trim()) return;
    const result = await action.run(() => rejectPayment(paymentId, reason), {
      successMessage: "Bukti pembayaran ditolak. Customer dapat mengunggah ulang.",
    });
    if (result.success) await resource.reload();
  }

  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) {
    if (/tidak berhak|akses|forbidden/i.test(resource.error)) {
      return <EmptyState title="Anda tidak memiliki akses" description="Order ini bukan milik vendor Anda." />;
    }
    if (/not found|tidak ditemukan/i.test(resource.error)) return <EmptyState title="Order tidak ditemukan" />;
    return <ErrorState retry={() => void resource.reload()} />;
  }

  const order = resource.data;
  if (!order) return <ErrorState retry={() => void resource.reload()} />;
  const payment = order.payments?.[0];

  return (
    <Page title={`Pesanan ${order.orderNumber}`} description="Verifikasi pembayaran dan tinjau kebutuhan customer.">
      {order.rejectReason && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Alasan penolakan pesanan:</strong> {order.rejectReason}
        </p>
      )}
      <DetailGrid
        items={[
          ["Customer", order.customer.fullName],
          ["Paket", order.productName],
          ["Tanggal", formatDate(order.eventDate)],
          ["Lokasi", order.eventLocation],
          ["Jumlah tamu", order.guestCount ? `${order.guestCount} tamu` : "-"],
          ["Total", formatCurrency(order.totalAmount)],
          ["Pembayaran", payment ? <StatusBadge key="payment" status={payment.status} /> : "-"],
          ["Status", <StatusBadge key="status" status={order.status} />],
          ["Catatan customer", order.notes || "-"],
        ]}
      />

      {payment && (
        <PaymentVerificationPanel
          actionLoading={action.loading}
          onReject={(reason) => void rejectCurrentPayment(payment.id, reason)}
          onVerify={() => void verifyCurrentPayment(payment.id)}
          payment={payment}
        />
      )}

      <OrderDecision
        actionLoading={action.loading}
        canDecide={canVendorDecide(order)}
        onAccept={() => void acceptOrder()}
        onReject={(reason) => void rejectCurrentOrder(reason)}
        payment={payment}
      />
    </Page>
  );
}

function PaymentVerificationPanel({
  actionLoading,
  onReject,
  onVerify,
  payment,
}: {
  actionLoading: boolean;
  onReject: (reason?: string) => void;
  onVerify: () => void;
  payment: OrderPayment;
}) {
  const canVerify = canVendorVerifyPayment(payment);
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Bukti pembayaran</h2>
          <p className="mt-1 text-sm text-stone-500">
            {payment.installment === "DP" ? "Pembayaran DP" : "Pembayaran penuh"} sebesar {formatCurrency(payment.amount)}
          </p>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      {payment.rejectReason && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Alasan penolakan bukti:</strong> {payment.rejectReason}
        </p>
      )}

      <div className="mt-5">
        {payment.proofAttachmentId ? (
          <PaymentProof attachmentId={payment.proofAttachmentId} />
        ) : (
          <p className="rounded-2xl bg-stone-50 p-5 text-sm text-stone-500">
            Customer belum mengunggah bukti pembayaran.
          </p>
        )}
      </div>

      {canVerify && payment.proofAttachmentId && (
        <div className="mt-5 flex flex-wrap gap-3 border-t pt-5">
          <AppButton disabled={actionLoading} loading={actionLoading} onClick={onVerify}>
            Verifikasi pembayaran
          </AppButton>
          <PopupConfirm
            description="Jelaskan alasan penolakan agar customer dapat memperbaiki bukti pembayaran."
            onConfirm={onReject}
            requireReason
            title="Tolak bukti pembayaran?"
            trigger={<AppButton disabled={actionLoading} variant="danger">Tolak bukti</AppButton>}
          />
        </div>
      )}
    </section>
  );
}

function OrderDecision({
  actionLoading,
  canDecide,
  onAccept,
  onReject,
  payment,
}: {
  actionLoading: boolean;
  canDecide: boolean;
  onAccept: () => void;
  onReject: (reason?: string) => void;
  payment?: OrderPayment;
}) {
  if (canDecide) {
    return (
      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Keputusan pesanan</h2>
        <p className="mt-1 text-sm text-stone-500">Pembayaran sudah terverifikasi. Konfirmasi apakah pesanan dapat diterima.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <AppButton disabled={actionLoading} loading={actionLoading} onClick={onAccept}>Terima pesanan</AppButton>
          <PopupConfirm description="Alasan penolakan wajib disampaikan kepada customer." onConfirm={onReject} requireReason title="Tolak pesanan?" trigger={<AppButton disabled={actionLoading} variant="danger">Tolak pesanan</AppButton>} />
        </div>
      </section>
    );
  }

  const message = payment?.status === "WAITING_VERIFICATION"
    ? "Verifikasi atau tolak bukti pembayaran terlebih dahulu."
    : payment?.status === "REJECTED"
      ? "Menunggu customer mengunggah ulang bukti pembayaran."
      : payment?.status === "WAITING_PAYMENT"
        ? "Menunggu customer mengunggah bukti pembayaran."
        : "Keputusan pesanan tersedia setelah pembayaran terverifikasi.";
  return <p className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">{message}</p>;
}
