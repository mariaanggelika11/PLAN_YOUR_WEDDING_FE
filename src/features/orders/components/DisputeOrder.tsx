"use client";
import { shouldReloadResource } from "@/shared/api/errorCodes";
import type { Order } from "../types";
import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import { AppButton } from "@/shared/components/ui/AppButton";
import { usePopup } from "@/shared/components/feedback/Popup";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";

export function DisputeOrder({
  order,
  admin = false,
  onChanged,
}: {
  order: Order;
  admin?: boolean;
  onChanged: () => Promise<unknown>;
}) {
  const popup = usePopup();
  const action = useAsyncAction();
  if (
    !order.active ||
    (admin
      ? order.status !== "DISPUTED"
      : !["CONFIRMED", "IN_PROGRESS", "WAITING_CUSTOMER_CONFIRMATION"].includes(order.status))
  )
    return null;
  async function submit(status?: "COMPLETED" | "CANCELLED") {
    const confirmed = await popup.confirm({
      title: admin ? "Selesaikan sengketa?" : "Ajukan sengketa?",
      message: admin
        ? `Pesanan akan diubah menjadi ${status}. Pastikan hasil mediasi sudah disepakati.`
        : "Jelaskan masalah pesanan untuk ditinjau admin.",
      requireReason: true,
      reasonLabel: admin ? "Catatan mediasi" : "Alasan sengketa",
      variant: "warning",
    });
    if (!confirmed.confirmed || !confirmed.reason) return;
    const result = await action.run(
      () =>
        authenticatedDataRequest<Order>(
          `${API_ROUTES.orders.byId(order.id)}/${admin ? "resolve-dispute" : "dispute"}`,
          {
            method: "PUT",
            body: JSON.stringify(
              admin ? { status, note: confirmed.reason } : { reason: confirmed.reason },
            ),
          },
        ),
      { successMessage: admin ? "Sengketa diselesaikan." : "Sengketa diajukan." },
    );
    if (result.success || shouldReloadResource(result.error)) await onChanged();
  }
  return (
    <div className="flex flex-wrap gap-3">
      {admin ? (
        <>
          <AppButton
            variant="secondary"
            loading={action.loading}
            onClick={() => void submit("COMPLETED")}
          >
            Tutup sengketa: pesanan selesai
          </AppButton>
          <AppButton
            variant="secondary"
            disabled={action.loading}
            onClick={() => void submit("CANCELLED")}
          >
            Tutup sengketa: pesanan dibatalkan
          </AppButton>
        </>
      ) : (
        <AppButton variant="secondary" loading={action.loading} onClick={() => void submit()}>
          Ajukan sengketa
        </AppButton>
      )}
    </div>
  );
}
