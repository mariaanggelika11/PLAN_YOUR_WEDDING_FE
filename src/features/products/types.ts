import type { ProductStatus } from "@/shared/types/models";

export interface VendorProduct {
  id: string;
  vendor: { id: number; businessName: string };
  category?: string | null;
  name: string;
  description?: string | null;
  price: number;
  minimumDp?: number | null;
  duration?: string | null;
  guestCapacity?: number | null;
  serviceArea?: string | null;
  terms?: string | null;
  status: ProductStatus;
  active: boolean;
  imageAttachmentIds: string[];
  averageRating: number;
  reviewCount: number;
  soldCount: number;
}

export interface VendorProductPage {
  data: VendorProduct[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

export interface VendorProductQuery {
  filter?: string;
  vendorId?: number;
  status?: ProductStatus;
  pageNumber?: number;
  pageSize?: number;
}
