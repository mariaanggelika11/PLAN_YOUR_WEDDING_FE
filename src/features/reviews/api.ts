import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import { findOrderReview } from "@/features/reviews/metrics";
import type { Order } from "@/features/orders/types";

export interface VendorProductReview {
  id: string;
  order?: { id: string; orderNumber: string };
  customer?: { id: number; fullName: string };
  vendor?: { id: number; businessName: string };
  vendorProduct?: { id: string; name: string };
  active: boolean;
  rating: number;
  comment?: string | null;
  imageAttachmentIds: string[];
  createdAt?: string;
}

export interface VendorProductReviewPage {
  data: VendorProductReview[];
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  total: number;
  pageNumber: number;
  pageSize: number;
}

export function getVendorProductReviews(
  query: {
    orderId?: string;
    vendorId?: number;
    vendorProductId?: string;
    customerId?: number;
    rating?: number;
    pageNumber?: number;
    pageSize?: number;
  } = {},
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const suffix = params.size ? `?${params}` : "";
  return authenticatedDataRequest<VendorProductReviewPage>(
    `${API_ROUTES.vendorProductReviews.root}${suffix}`,
  );
}

export async function getReviewForOrder(order: Pick<Order, "id" | "customer" | "vendorProduct">) {
  const page = await getVendorProductReviews({
    orderId: order.id,
    customerId: order.customer.id,
    vendorProductId: order.vendorProduct.id,
    pageNumber: 1,
    pageSize: 1,
  });
  return findOrderReview(page.data, order.id);
}

export function createVendorProductReview(orderId: string, form: HTMLFormElement) {
  const source = new FormData(form);
  const body = new FormData();
  body.set("orderId", orderId);
  body.set("rating", String(source.get("rating") ?? ""));
  const comment = String(source.get("comment") ?? "").trim();
  if (comment) body.set("comment", comment);
  source.getAll("images").forEach((image) => {
    if (image instanceof File && image.size > 0) body.append("images", image);
  });
  return authenticatedDataRequest<VendorProductReview>(API_ROUTES.vendorProductReviews.root, {
    method: "POST",
    body,
  });
}
