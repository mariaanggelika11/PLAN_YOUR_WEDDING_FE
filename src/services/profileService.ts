import { API_ROUTES } from "@/constants/apiRoutes";
import { ApiError } from "@/services/api";
import {
  authenticatedDataRequest,
  authenticatedRequest,
  getAuthenticatedContext,
} from "@/services/authenticatedApi";
import type {
  CustomerApiProfile,
  VendorApiProfile,
  VendorProfileUpdatePayload,
} from "@/types/profile";

export interface VendorRelatedData {
  contacts: Array<{ id?: string; contactType: string; contactValue: string }>;
  bankAccount?: { bankName: string; accountNumber: string; accountHolderName: string };
  bankAccountId?: string;
  verificationDocument?: { documentType: string; documentNumber?: string; file: File };
}

export class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileError";
  }
}

let customerProfileRequest: Promise<CustomerApiProfile | null> | null = null;
let vendorProfileRequest: Promise<VendorApiProfile | null> | null = null;

export function getCustomerProfile() {
  if (!customerProfileRequest) {
    customerProfileRequest = getOwnProfile<CustomerApiProfile>(
      API_ROUTES.profile.customerByUserId,
    ).finally(() => {
      customerProfileRequest = null;
    });
  }
  return customerProfileRequest;
}

export function getVendorProfile() {
  if (!vendorProfileRequest) {
    vendorProfileRequest = getOwnProfile<VendorApiProfile>(
      API_ROUTES.profile.vendorByUserId,
    ).finally(() => {
      vendorProfileRequest = null;
    });
  }
  return vendorProfileRequest;
}

export function saveCustomerProfileDraft(data: FormData) {
  return saveCustomerProfileForm(API_ROUTES.profile.customerSaveDraft, data);
}

export function saveVendorProfileDraft(data: FormData) {
  return saveVendorProfileForm(API_ROUTES.profile.vendorSaveDraft, data);
}

export function submitVendorProfile(data: FormData) {
  return saveVendorProfileForm(API_ROUTES.profile.vendorSubmit, data);
}

export async function updateVendorProfile(id: number, data: VendorProfileUpdatePayload) {
  try {
    return await authenticatedDataRequest<VendorApiProfile>(API_ROUTES.profile.vendorById(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    throw profileError(error, "Informasi bisnis gagal diperbarui.");
  }
}

export async function saveVendorRelatedData(data: VendorRelatedData) {
  const { userId } = profileContext();

  for (const contact of data.contacts) {
    const { id, ...payload } = contact;
    await authenticatedRequest(
      id ? API_ROUTES.contacts.byId(id) : API_ROUTES.contacts.forUser(userId),
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      },
    );
  }

  if (data.bankAccount) {
    await authenticatedRequest(
      data.bankAccountId
        ? API_ROUTES.bankAccounts.byId(data.bankAccountId)
        : API_ROUTES.bankAccounts.forUser(userId),
      {
        method: data.bankAccountId ? "PUT" : "POST",
        body: JSON.stringify(data.bankAccount),
      },
    );
  }

  if (data.verificationDocument) {
    const document = new FormData();
    document.set("documentType", data.verificationDocument.documentType);
    if (data.verificationDocument.documentNumber) {
      document.set("documentNumber", data.verificationDocument.documentNumber);
    }
    document.set("file", data.verificationDocument.file);
    await authenticatedRequest(API_ROUTES.verificationDocuments.forUser(userId), {
      method: "POST",
      body: document,
    });
  }

  return getVendorProfile();
}

export async function deleteVendorContact(id: string) {
  return deleteVendorResource(API_ROUTES.contacts.byId(id));
}

export async function deleteVendorBankAccount(id: string) {
  return deleteVendorResource(API_ROUTES.bankAccounts.byId(id));
}

export async function deleteVendorVerificationDocument(id: string) {
  return deleteVendorResource(API_ROUTES.verificationDocuments.byId(id));
}

async function deleteVendorResource(endpoint: string) {
  try {
    await authenticatedRequest(endpoint, { method: "DELETE" });
  } catch (error) {
    throw profileError(error, "Data gagal dihapus.");
  }
}

async function getOwnProfile<T>(endpointForUser: (userId: number) => string) {
  const { userId } = profileContext();

  try {
    return await authenticatedDataRequest<T>(endpointForUser(userId));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw profileError(error, "Profile gagal dimuat.");
  }
}

async function saveCustomerProfileForm(endpoint: string, data: FormData) {
  const { userId } = profileContext();
  data.set("userId", String(userId));

  try {
    return await authenticatedDataRequest<CustomerApiProfile>(endpoint, {
      method: "POST",
      body: data,
    });
  } catch (error) {
    throw profileError(error, "Profile gagal disimpan.");
  }
}

async function saveVendorProfileForm(endpoint: string, data: FormData) {
  const { userId } = profileContext();
  data.set("userId", String(userId));

  try {
    return await authenticatedDataRequest<VendorApiProfile>(endpoint, {
      method: "POST",
      body: data,
    });
  } catch (error) {
    throw profileError(error, "Profile vendor gagal disimpan.");
  }
}

function profileContext() {
  try {
    return getAuthenticatedContext();
  } catch (error) {
    throw profileError(error, "Sesi login tidak ditemukan. Silakan masuk kembali.");
  }
}

function profileError(error: unknown, fallback: string) {
  if (error instanceof ProfileError) return error;
  if (error instanceof ApiError) return new ProfileError(error.message);
  return new ProfileError(fallback);
}
