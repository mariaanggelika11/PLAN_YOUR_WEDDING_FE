import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import type { VendorProductQuery } from "@/features/products/types";
export interface MarketplaceOptions {
  locations: string[];
  priceRange: { min: number; max: number };
  maxCapacity: number;
  sortOptions: NonNullable<VendorProductQuery["sortBy"]>[];
}
export const getMarketplaceOptions = () =>
  authenticatedDataRequest<MarketplaceOptions>("/vendor-products/filter-options");
export interface Availability {
  vendorProductId: string;
  eventDate: string;
  available: boolean;
  capacity: number;
  bookedCount: number;
  remaining: number;
  reason: null | "DATE_FULL" | "PAST_DATE" | "PRODUCT_UNAVAILABLE";
  message: string;
}
export const getAvailability = (id: string, eventDate: string) =>
  authenticatedDataRequest<Availability>(
    `/vendor-products/${encodeURIComponent(id)}/availability?${new URLSearchParams({ eventDate })}`,
  );
