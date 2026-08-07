interface ProfileUser {
  id: number;
  email: string;
  fullname: string;
}

export interface CustomerApiProfile {
  id: number;
  user: ProfileUser;
  fullName: string;
  gender?: number | null;
  birthDate?: string | null;
  avatarUrl?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  weddingDate?: string | null;
  weddingLocation?: string | null;
  weddingCity?: string | null;
  weddingProvince?: string | null;
  eventType?: string | null;
  weddingTheme?: string | null;
  estimatedGuests?: number | null;
  neededVendorCategories?: string[] | null;
  preferredVendorLocation?: string | null;
  packagePreference?: string | null;
  estimatedBudget?: number | null;
  budgetRangeMin?: number | null;
  budgetRangeMax?: number | null;
  budgetPriorities?: string[] | null;
}

export interface CustomerProfilePayload {
  fullName: string;
  gender?: number;
  birthDate?: string;
  avatarUrl?: string;
  address?: string;
  city?: string;
  province?: string;
  weddingDate?: string;
  weddingLocation?: string;
  weddingCity?: string;
  weddingProvince?: string;
  eventType?: string;
  weddingTheme?: string;
  estimatedGuests?: number;
  neededVendorCategories?: string[];
  preferredVendorLocation?: string;
  packagePreference?: string;
  estimatedBudget?: number;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
  budgetPriorities?: string[];
}

export interface VendorApiProfile {
  id: number;
  user: ProfileUser;
  businessName?: string | null;
  ownerName?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  city?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  serviceArea?: string | null;
  logoUrl?: string | null;
  selectedCategories?: string[] | null;
  portfolioImageUrls?: string[] | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  websiteUrl?: string | null;
  whatsappNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  legalDocumentType?: string | null;
  legalDocumentNumber?: string | null;
  isVerified: boolean;
  rejectReason?: string | null;
}

export interface VendorProfilePayload {
  businessName?: string;
  ownerName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  serviceArea?: string;
  logoUrl?: string;
  selectedCategories?: string[];
  portfolioImageUrls?: string[];
  instagramUrl?: string;
  tiktokUrl?: string;
  websiteUrl?: string;
  whatsappNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  legalDocumentType?: string;
  legalDocumentNumber?: string;
}
