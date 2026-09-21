import { getVendorProducts } from "@/features/products/api";
import { getVendorProductReviews } from "@/features/reviews/api";
import type { VendorApiProfile } from "@/features/profile/types";
import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import { assertStoreOwnership, parseStoreId } from "./storeRules";

export async function getStore(id: string) {
  const vendorId = parseStoreId(id);
  const profile = await authenticatedDataRequest<VendorApiProfile>(
    API_ROUTES.profile.vendorById(vendorId),
  );
  if (Number(profile.id) !== vendorId || profile.active === false) {
    throw new Error("Toko tidak tersedia.");
  }
  return {
    id: vendorId,
    name: profile.businessName || "Toko vendor",
    description: profile.description,
    location: [profile.city, profile.province].filter(Boolean).join(", "),
    serviceArea: profile.serviceArea,
    categories: profile.categories ?? [],
    verified: profile.isVerified === true,
    logoAttachmentId: profile.logoAttachmentId,
    logoUrl: profile.logoUrl,
  };
}

export async function getStoreProducts(vendorId: number, pageNumber: number) {
  const page = await getVendorProducts({ vendorId, status: "ACTIVE", pageNumber, pageSize: 12 });
  assertStoreOwnership(page.data, vendorId);
  return { ...page, data: page.data.filter((item) => item.active && item.status === "ACTIVE") };
}

export async function getStoreReviews(vendorId: number, pageNumber: number) {
  const page = await getVendorProductReviews({ vendorId, pageNumber, pageSize: 10 });
  assertStoreOwnership(page.data, vendorId);
  return { ...page, data: page.data.filter((item) => item.active !== false) };
}
