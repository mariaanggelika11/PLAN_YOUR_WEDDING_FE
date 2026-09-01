import type { OrderPayment } from "@/features/orders/types";
import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import type { PaymentStatus } from "@/shared/types/models";

export interface PaymentPage {
  data: OrderPayment[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

export function getPayments(query: { pageNumber?: number; pageSize?: number; status?: PaymentStatus } = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const suffix = params.size ? `?${params}` : "";
  return authenticatedDataRequest<PaymentPage>(`${API_ROUTES.orderPayments.root}${suffix}`);
}

export function getPayment(id: string) {
  return authenticatedDataRequest<OrderPayment>(API_ROUTES.orderPayments.byId(id));
}
