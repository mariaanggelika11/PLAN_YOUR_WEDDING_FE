import type { VendorApiProfile } from "@/features/profile/types";

export interface PaginatedData<T> {
  data: T[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

export interface AdminUser {
  id: number;
  fullname: string;
  email: string;
  phoneNumber?: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  roles?: string[];
}

export interface AdminUserRole {
  id: number;
  userId: number;
  fullname: string;
  email: string;
  roleId: number;
  roleName: string;
  isPrimary: boolean;
}

export interface VendorAdminProfile extends Omit<
  VendorApiProfile,
  "categories" | "contacts" | "bankAccounts" | "verificationDocuments" | "portfolioAttachmentIds"
> {
  categories: string[] | string | null;
  contacts?: VendorApiProfile["contacts"];
  bankAccounts?: VendorApiProfile["bankAccounts"];
  verificationDocuments?: VendorApiProfile["verificationDocuments"];
  portfolioAttachmentIds?: string[];
  logoAttachmentId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type { AdminSummary } from "@/shared/types/models";
