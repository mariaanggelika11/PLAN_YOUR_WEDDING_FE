"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { ConfirmationDeadline } from "@/features/orders/components/ConfirmationDeadline";
import { useOrderRefresh } from "@/features/orders/useOrderRefresh";
import { OrderConversation } from "@/features/orders/components/OrderConversation";
import { shouldReloadResource, apiErrorStatus, isForbiddenResource } from "@/shared/api/errorCodes";
import { canPayOrder } from "@/features/orders/rules";
import { DisputeOrder } from "@/features/orders/components/DisputeOrder";

import {
  confirmOrder,
  deliverOrder,
  getOrder,
  getOrdersWithPayments,
  rejectOrder,
  rejectPayment,
  startOrder,
  verifyPayment,
} from "@/features/orders/repository";
import {
  canVendorDecide,
  getCurrentPayment,
  paymentInstallmentLabel,
  sortPaymentsByInstallment,
} from "@/features/orders/rules";
import { buildOrderTimeline } from "@/features/orders/timeline";
import { PaymentProofHistory } from "@/features/orders/components/PaymentProofHistory";
import { PaymentProof } from "@/features/orders/components/PaymentProof";
import { PaymentStagesCompact, PaymentSummary } from "@/features/orders/components/PaymentSummary";
import type { Order, OrderPayment } from "@/features/orders/types";
import { OrderOverview } from "@/features/orders/components/OrderOverview";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
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
  const { translateText, locale } = useTranslation();
  const loader = useCallback(
    (query: { filter?: string; pageNumber?: number; pageSize?: number }) =>
      getOrdersWithPayments(query),
    [],
  );
  const orders = usePaginatedResource(loader, { pageSize: 10 });
  useOrderRefresh(orders.reload, orders.loading);

  if (orders.loading && !orders.data.length) return <LoadingSkeleton />;
  if (orders.error) return <ErrorState retry={() => void orders.reload()} />;
  if (!orders.data.length) {
    return (
      <EmptyState
        title={translateText("Belum ada pesanan masuk")}
        description={translateText("Order untuk produk vendor Anda akan muncul di sini.")}
      />
    );
  }

  return (
    <Page
      title={translateText("Pesanan Vendor")}
      description={translateText("Tinjau pesanan masuk dan status pelaksanaan.")}
    >
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
        itemLabel="pesanan"
        onPageChange={orders.setPage}
        onSearchChange={orders.changeSearch}
        page={orders.page}
        pageSize={10}
        rows={orders.data.map((order) => [
          order.orderNumber,
          order.customer.fullName,
          order.productName,
          formatDate(order.eventDate, locale),
          order.eventLocation,
          <PaymentStagesCompact key="payment" payments={order.payments} />,
          <StatusBadge key="order" status={order.status} />,
          <Link
            className="font-semibold text-blush"
            href={ROUTES.vendor.order(order.id)}
            key="detail"
          >
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
  const { translateText, locale } = useTranslation();
  const popup = usePopup();
  const action = useAsyncAction();
  const loader = useCallback(() => getOrder(orderId), [orderId]);
  const resource = useAsyncResource<Order | null>(loader, { initialData: null });
  useOrderRefresh(resource.reload, resource.loading || action.loading);

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
    if (result.success || shouldReloadResource(result.error)) await resource.reload();
  }

  async function rejectCurrentOrder(reason?: string) {
    if (!reason?.trim()) return;
    const result = await action.run(() => rejectOrder(orderId, reason), {
      successMessage: "Pesanan berhasil ditolak.",
    });
    if (result.success || shouldReloadResource(result.error)) await resource.reload();
  }

  async function startCurrentOrder() {
    const result = await action.run(() => startOrder(orderId), {
      successMessage: "Pengerjaan pesanan dimulai.",
    });
    if (result.success || shouldReloadResource(result.error)) await resource.reload();
  }

  async function deliverCurrentOrder() {
    const confirmation = await popup.confirm({
      title: "Tandai layanan selesai?",
      message: "Customer akan diminta memeriksa layanan dan mengonfirmasi penyelesaian pesanan.",
      confirmLabel: "Kirim ke customer",
      variant: "success",
    });
    if (!confirmation.confirmed) return;
    const result = await action.run(() => deliverOrder(orderId), {
      successMessage: "Layanan ditandai selesai dan menunggu konfirmasi customer.",
    });
    if (result.success || shouldReloadResource(result.error)) await resource.reload();
  }

  async function verifyCurrentPayment(paymentId: string) {
    const confirmation = await popup.confirm({
      title: "Verifikasi pembayaran?",
      message: "Pastikan bukti transfer, rekening tujuan, dan nominal pembayaran sudah sesuai.",
      confirmLabel: "Verifikasi",
      variant: "success",
    });
    if (!confirmation.confirmed) return;
    const result = await action.run(() => verifyPayment(paymentId), {
      successMessage: "Pembayaran berhasil diverifikasi.",
    });
    if (result.success || shouldReloadResource(result.error)) await resource.reload();
  }

  async function rejectCurrentPayment(paymentId: string, reason?: string) {
    if (!reason?.trim()) return;
    const result = await action.run(() => rejectPayment(paymentId, reason), {
      successMessage: "Bukti pembayaran ditolak. Customer dapat mengunggah ulang.",
    });
    if (result.success || shouldReloadResource(result.error)) await resource.reload();
  }

  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) {
    if (isForbiddenResource(resource.errorCause)) {
      return (
        <EmptyState
          title={translateText("Anda tidak memiliki akses")}
          description={translateText("Order ini bukan milik vendor Anda.")}
        />
      );
    }
    if (apiErrorStatus(resource.errorCause) === 404)
      return <EmptyState title={translateText("Order tidak ditemukan")} />;
    return <ErrorState retry={() => void resource.reload()} />;
  }

  const order = resource.data;
  if (!order) return <ErrorState retry={() => void resource.reload()} />;
  const payment = getCurrentPayment(order.payments);

  return (
    <Page
      title={translateText("Pesanan {0}", { 0: order.orderNumber })}
      description={translateText("Verifikasi pembayaran dan tinjau kebutuhan customer.")}
    >
      {order.rejectReason && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>{translateText("Alasan penolakan pesanan:")}</strong> {order.rejectReason}
        </p>
      )}
      <ConfirmationDeadline order={order} />
      <DisputeOrder order={order} onChanged={resource.reload} />
      <OrderOverview
        details={[
          ["Customer", order.customer.fullName],
          ["Paket", order.productName],
          ["Tanggal", formatDate(order.eventDate, locale)],
          ["Lokasi", order.eventLocation],
          [
            "Jumlah tamu",
            order.guestCount ? translateText("{0} tamu", { 0: order.guestCount }) : "-",
          ],
          ["Total", formatCurrency(order.totalAmount, locale)],
          ["Pembayaran", payment ? <StatusBadge key="payment" status={payment.status} /> : "-"],
          ["Status", <StatusBadge key="status" status={order.status} />],
          ["Catatan customer", order.notes || "-"],
        ]}
        timeline={buildOrderTimeline(order, locale)}
        paymentSummary={<PaymentSummary order={order} />}
      />
      <OrderConversation key={order.id} orderId={order.id} status={order.status} />

      {!!order.payments?.length && (
        <section className="grid gap-4">
          <SectionHeader
            title={translateText("Bukti pembayaran per tahap")}
            description={translateText(
              "Periksa dan verifikasi setiap pembayaran customer secara terpisah.",
            )}
          />
          {sortPaymentsByInstallment(order.payments).map((item) => (
            <PaymentVerificationPanel
              allowVerification={canPayOrder(order)}
              actionLoading={action.loading}
              key={item.id}
              onReject={(reason) => void rejectCurrentPayment(item.id, reason)}
              onVerify={() => void verifyCurrentPayment(item.id)}
              payment={item}
            />
          ))}
        </section>
      )}

      <OrderDecision
        actionLoading={action.loading}
        onAccept={() => void acceptOrder()}
        onDeliver={() => void deliverCurrentOrder()}
        onReject={(reason) => void rejectCurrentOrder(reason)}
        onStart={() => void startCurrentOrder()}
        order={order}
        payment={payment}
      />
    </Page>
  );
}

function PaymentVerificationPanel({
  allowVerification,
  actionLoading,
  onReject,
  onVerify,
  payment,
}: {
  allowVerification: boolean;
  actionLoading: boolean;
  onReject: (reason?: string) => void;
  onVerify: () => void;
  payment: OrderPayment;
}) {
  const { translateText, locale } = useTranslation();
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{translateText("Bukti pembayaran")}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {paymentInstallmentLabel(payment.installment, locale)} {translateText("sebesar")}{" "}
            {formatCurrency(payment.amount, locale)}
          </p>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      {payment.rejectReason && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>{translateText("Alasan penolakan bukti:")}</strong> {payment.rejectReason}
        </p>
      )}

      <div className="mt-5">
        {payment.proofAttachmentId ? (
          <>
            <PaymentProof attachmentId={payment.proofAttachmentId} />
            <PaymentProofHistory proofs={payment.proofs} />
          </>
        ) : (
          <p className="rounded-xl bg-stone-50 p-5 text-sm text-stone-600">
            {translateText("Customer belum mengunggah bukti pembayaran.")}{" "}
          </p>
        )}
      </div>

      {allowVerification &&
        payment.active !== false &&
        payment.status === "WAITING_VERIFICATION" && (
          <div className="mt-5 flex flex-wrap gap-3 border-t pt-5">
            <AppButton
              disabled={actionLoading || !payment.proofAttachmentId}
              loading={actionLoading}
              onClick={onVerify}
            >
              {translateText("Verifikasi")} {paymentInstallmentLabel(payment.installment, locale)}
            </AppButton>
            <PopupConfirm
              description={translateText(
                "Jelaskan alasan penolakan agar customer dapat memperbaiki bukti pembayaran.",
              )}
              onConfirm={onReject}
              requireReason
              title={translateText("Tolak bukti {0}?", {
                0: paymentInstallmentLabel(payment.installment, locale),
              })}
              trigger={
                <AppButton disabled={actionLoading || !payment.proofAttachmentId} variant="danger">
                  {translateText("Tolak bukti")}{" "}
                </AppButton>
              }
            />
          </div>
        )}
    </section>
  );
}

function OrderDecision({
  actionLoading,
  onAccept,
  onDeliver,
  onReject,
  onStart,
  order,
  payment,
}: {
  actionLoading: boolean;
  onAccept: () => void;
  onDeliver: () => void;
  onReject: (reason?: string) => void;
  onStart: () => void;
  order: Order;
  payment?: OrderPayment;
}) {
  const { translateText, locale } = useTranslation();
  if (canVendorDecide(order)) {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-ink">{translateText("Keputusan pesanan")}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {translateText(
            "Pembayaran sudah terverifikasi. Konfirmasi apakah pesanan dapat diterima.",
          )}{" "}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <AppButton disabled={actionLoading} loading={actionLoading} onClick={onAccept}>
            {translateText("Terima pesanan")}{" "}
          </AppButton>
          <PopupConfirm
            description={translateText("Alasan penolakan wajib disampaikan kepada customer.")}
            onConfirm={onReject}
            requireReason
            title={translateText("Tolak pesanan?")}
            trigger={
              <AppButton disabled={actionLoading} variant="danger">
                {translateText("Tolak pesanan")}{" "}
              </AppButton>
            }
          />
        </div>
      </section>
    );
  }

  if (order.status === "CONFIRMED") {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-ink">{translateText("Pelaksanaan pesanan")}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {translateText("Mulai pengerjaan ketika layanan sudah memasuki tahap pelaksanaan.")}{" "}
        </p>
        <AppButton className="mt-5" loading={actionLoading} onClick={onStart}>
          {translateText("Mulai pengerjaan")}{" "}
        </AppButton>
      </section>
    );
  }

  if (order.status === "IN_PROGRESS") {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-ink">{translateText("Pelaksanaan pesanan")}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {translateText(
            "Jika seluruh layanan telah diberikan, kirim penyelesaian untuk dikonfirmasi customer.",
          )}{" "}
        </p>
        <AppButton className="mt-5" loading={actionLoading} onClick={onDeliver}>
          {translateText("Tandai layanan selesai")}{" "}
        </AppButton>
      </section>
    );
  }

  if (order.status === "WAITING_CUSTOMER_CONFIRMATION") {
    return (
      <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        {translateText(
          "Layanan telah diserahkan. Menunggu customer mengonfirmasi pesanan selesai.",
        )}{" "}
      </p>
    );
  }

  if (order.status === "COMPLETED") {
    return (
      <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
        {translateText("Pesanan telah selesai dan dikonfirmasi customer.")}{" "}
      </p>
    );
  }

  const message =
    payment?.status === "WAITING_VERIFICATION"
      ? translateText("{0} menunggu verifikasi Anda.", {
          0: paymentInstallmentLabel(payment.installment, locale),
        })
      : payment?.status === "REJECTED"
        ? "Menunggu customer mengunggah ulang bukti pembayaran."
        : payment?.status === "WAITING_PAYMENT"
          ? "Menunggu customer mengunggah bukti pembayaran."
          : "Keputusan pesanan tersedia setelah pembayaran terverifikasi.";
  return <p className="rounded-xl bg-stone-100 p-4 text-sm text-stone-600">{message}</p>;
}
