import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import type { CreateOrderPayload, Order, OrderPage, OrderQuery, OrderPayment } from "./types";

function queryString(query: OrderQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.size ? `?${params}` : "";
}

export function createOrder(payload: CreateOrderPayload) {
  return authenticatedDataRequest<Order>(API_ROUTES.orders.root, { method: "POST", body: JSON.stringify(payload) });
}
export function getOrders(query: OrderQuery = {}) {
  return authenticatedDataRequest<OrderPage>(`${API_ROUTES.orders.root}${queryString(query)}`);
}
/**
 * Compatibility adapter while GET /orders does not include payment summaries.
 * A failed detail request keeps the corresponding list row available.
 */
export async function getOrdersWithPayments(query: OrderQuery = {}) {
  const page = await getOrders(query);
  const details = await Promise.allSettled(page.data.map((order) => getOrder(order.id)));
  return {
    ...page,
    data: page.data.map((order, index) => {
      const detail = details[index];
      return detail?.status === "fulfilled" ? detail.value : order;
    }),
  };
}
export function getOrder(id: string) {
  return authenticatedDataRequest<Order>(API_ROUTES.orders.byId(id));
}
export function confirmOrder(id: string) {
  return authenticatedDataRequest<Order>(API_ROUTES.orders.confirm(id), { method: "PUT" });
}
export function rejectOrder(id: string, rejectReason: string) {
  return authenticatedDataRequest<Order>(API_ROUTES.orders.reject(id), { method: "PUT", body: JSON.stringify({ rejectReason: rejectReason.trim() }) });
}
export function startOrder(id: string) {
  return authenticatedDataRequest<Order>(API_ROUTES.orders.start(id), { method: "PUT" });
}
export function deliverOrder(id: string) {
  return authenticatedDataRequest<Order>(API_ROUTES.orders.deliver(id), { method: "PUT" });
}
export function completeOrder(id: string) {
  return authenticatedDataRequest<Order>(API_ROUTES.orders.complete(id), { method: "PUT" });
}
export function submitPaymentProof(paymentId: string, proof: File) {
  const body = new FormData();
  body.set("proof", proof);
  return authenticatedDataRequest<OrderPayment>(API_ROUTES.orderPayments.proof(paymentId), { method: "PUT", body });
}
export function verifyPayment(paymentId: string) {
  return authenticatedDataRequest<OrderPayment>(API_ROUTES.orderPayments.verify(paymentId), {
    method: "PUT",
  });
}
export function rejectPayment(paymentId: string, rejectReason: string) {
  return authenticatedDataRequest<OrderPayment>(API_ROUTES.orderPayments.reject(paymentId), {
    method: "PUT",
    body: JSON.stringify({ rejectReason: rejectReason.trim() }),
  });
}
