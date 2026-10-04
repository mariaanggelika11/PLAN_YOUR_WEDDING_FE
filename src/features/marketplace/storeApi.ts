import { getVendorProducts } from "@/features/products/api";
import { getVendorProductReviews } from "@/features/reviews/api";
interface PublicStore {
  id: number;
  businessName: string;
  description: string | null;
  city: string | null;
  province: string | null;
  serviceArea: string | null;
  categories: string[];
  isVerified: boolean;
  logoUrl: string | null;
  logoAttachmentId: string | null;
  portfolioAttachmentIds: string[];
  joinedAt: string;
  stats: { productCount: number; averageRating: number; reviewCount: number; soldCount: number };
  ratingBreakdown: Record<string, number>;
}
import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import { assertStoreOwnership, parseStoreId } from "./storeRules";

export async function getStore(id: string) {
  const vendorId = parseStoreId(id);
  const profile = await authenticatedDataRequest<PublicStore>(
    `${API_ROUTES.profile.vendorById(vendorId)}/store`,
  );
  if (Number(profile.id) !== vendorId) {
    throw new Error("Toko tidak tersedia.");
  }
  return {
    id: vendorId,
    stats: profile.stats,
    joinedAt: profile.joinedAt,
    name: profile.businessName || "Toko vendor",
    description: profile.description,
    location: [profile.city, profile.province].filter(Boolean).join(", "),
    serviceArea: profile.serviceArea,
    categories: profile.categories ?? [],
    verified: profile.isVerified === true,
    portfolioAttachmentIds: profile.portfolioAttachmentIds ?? [],
    logoAttachmentId: profile.logoAttachmentId,
    logoUrl: profile.logoUrl,
  };
}

export async function getStoreProducts(vendorId: number, pageNumber: number) {
  const page = await getVendorProducts({
    vendorId,
    marketplace: true,
    status: "ACTIVE",
    pageNumber,
    pageSize: 12,
  });
  assertStoreOwnership(page.data, vendorId);
  return { ...page, data: page.data.filter((item) => item.active && item.status === "ACTIVE") };
}

export async function getStoreReviews(vendorId: number, pageNumber: number) {
  const page = await getVendorProductReviews({ vendorId, pageNumber, pageSize: 10 });
  assertStoreOwnership(page.data, vendorId);
  return { ...page, data: page.data.filter((item) => item.active !== false) };
}
