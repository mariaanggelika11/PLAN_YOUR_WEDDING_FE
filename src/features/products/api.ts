import type {
  VendorProduct,
  VendorProductPage,
  VendorProductQuery,
} from "@/features/products/types";
import {
  authenticatedDataRequest,
  authenticatedRequest,
} from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";

export function getVendorProducts(query: VendorProductQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return authenticatedDataRequest<VendorProductPage>(`${API_ROUTES.vendorProducts.root}?${params}`);
}

export function getVendorProduct(id: string) {
  return authenticatedDataRequest<VendorProduct>(API_ROUTES.vendorProducts.byId(id));
}

export function createVendorProduct(payload: FormData) {
  return authenticatedDataRequest<VendorProduct>(API_ROUTES.vendorProducts.root, {
    method: "POST",
    body: productRequestBody(payload),
  });
}

export function updateVendorProduct(id: string, payload: FormData) {
  return authenticatedDataRequest<VendorProduct>(API_ROUTES.vendorProducts.byId(id), {
    method: "PUT",
    body: productRequestBody(payload),
  });
}

export function deleteVendorProduct(id: string) {
  return authenticatedRequest(API_ROUTES.vendorProducts.byId(id), { method: "DELETE" });
}

function productRequestBody(payload: FormData): FormData | string {
  const hasImages = payload
    .getAll("images")
    .some((value) => value instanceof File && value.size > 0);
  if (hasImages) return payload;

  const numericFields = new Set(["vendorId", "price", "minimumDp", "guestCapacity"]);
  const result: Record<string, string | number | boolean> = {};
  payload.forEach((value, key) => {
    if (typeof value !== "string") return;
    if (numericFields.has(key)) {
      result[key] = Number(value);
    } else if (key === "active") {
      result[key] = value === "true";
    } else {
      result[key] = value;
    }
  });
  return JSON.stringify(result);
}
