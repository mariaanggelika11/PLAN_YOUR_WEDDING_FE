import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";

export interface VendorProductReview {
  id: string;
  order: { id: string; orderNumber: string };
  rating: number;
  comment?: string | null;
  imageAttachmentIds: string[];
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
