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
}

export interface CustomerProfilePayload {
  fullName: string;
  gender?: number;
  birthDate?: string;
  avatarUrl?: string;
  address?: string;
  city?: string;
  province?: string;
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
}
