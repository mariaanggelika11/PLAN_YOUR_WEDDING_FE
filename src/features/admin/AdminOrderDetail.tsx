"use client";
import { OrderConversation } from "@/features/orders/components/OrderConversation";
import { useCallback } from "react";
import { getOrder } from "@/features/orders/repository";
import { OrderOverview } from "@/features/orders/components/OrderOverview";
import { PaymentSummary } from "@/features/orders/components/PaymentSummary";
import { DisputeOrder } from "@/features/orders/components/DisputeOrder";
import { buildOrderTimeline } from "@/features/orders/timeline";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { formatDate } from "@/shared/utils/formatDate";
export function AdminOrderDetail({ id }: { id: string }) {
  const loader = useCallback(() => getOrder(id), [id]);
  const resource = useAsyncResource(loader, { initialData: null });
  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <ErrorState retry={() => void resource.reload()} />;
  const order = resource.data;
  if (!order) return null;
  return (
    <FeaturePage
      title={`Pesanan ${order.orderNumber}`}
      description="Detail transaksi dan tindak lanjut sengketa."
    >
      <OrderOverview
        details={[
          ["Customer", order.customer.fullName],
          ["Vendor", order.vendor.businessName],
          ["Paket", order.productName],
          ["Tanggal", formatDate(order.eventDate)],
          ["Lokasi", order.eventLocation],
          ["Status", <StatusBadge key="status" status={order.status} />],
        ]}
        timeline={buildOrderTimeline(order)}
        paymentSummary={<PaymentSummary order={order} />}
      />
      <OrderConversation key={order.id} orderId={order.id} />
      {order.rejectReason && (
        <p className="rounded-xl border bg-white p-4 text-sm">
          Catatan pesanan: {order.rejectReason}
        </p>
      )}
      <DisputeOrder order={order} admin onChanged={resource.reload} />
    </FeaturePage>
  );
}
