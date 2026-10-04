"use client";
import { shouldReloadResource } from "@/shared/api/errorCodes";
import { cancelOrder } from "../repository";
import { canCancelOrder } from "../rules";
import type { Order } from "../types";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { usePopup } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
export function CancelOrder({
  order,
  onCancelled,
}: {
  order: Order;
  onCancelled: () => Promise<unknown>;
}) {
  const action = useAsyncAction();
  const popup = usePopup();
  if (!canCancelOrder(order)) return null;
  async function cancel() {
    const result = await popup.confirm({
      title: "Batalkan pesanan?",
      message:
        "Pembatalan tidak otomatis mengembalikan pembayaran. Pastikan ketentuan pembatalan telah disepakati dengan vendor.",
      requireReason: true,
      reasonLabel: "Alasan pembatalan",
      confirmLabel: "Batalkan pesanan",
      variant: "warning",
    });
    if (!result.confirmed || !result.reason) return;
    const saved = await action.run(() => cancelOrder(order.id, result.reason!), {
      successMessage: "Pesanan dibatalkan.",
    });
    if (saved.success || shouldReloadResource(saved.error)) await onCancelled();
  }
  return (
    <AppButton
      variant="secondary"
      className="w-fit"
      loading={action.loading}
      onClick={() => void cancel()}
    >
      Batalkan pesanan
    </AppButton>
  );
}
