import type { CustomerApiProfile, VendorApiProfile } from "@/features/profile/types";
import { ApiError } from "@/shared/api/apiClient";
import {
  authenticatedDataRequest,
  authenticatedRequest,
  getAuthenticatedContext,
} from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";

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

export function updateCustomerProfile(id: number, data: FormData) {
  return profileRequest<CustomerApiProfile>(
    API_ROUTES.profile.customerById(id),
    { method: "PUT", body: data },
    "Profile customer gagal diperbarui.",
  );
}

export function saveVendorProfileDraft(data: FormData) {
  return saveVendorProfileForm(API_ROUTES.profile.vendorSaveDraft, data);
}

export function submitVendorProfile(data: FormData) {
  return saveVendorProfileForm(API_ROUTES.profile.vendorSubmit, data);
}

export async function updateVendorProfile(id: number, data: FormData) {
  return profileRequest<VendorApiProfile>(
    API_ROUTES.profile.vendorById(id),
    {
      method: "PUT",
      body: data,
    },
    "Informasi bisnis gagal diperbarui.",
  );
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
  await profileRequest(endpoint, { method: "DELETE" }, "Data gagal dihapus.", false);
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

  return profileRequest<CustomerApiProfile>(
    endpoint,
    {
      method: "POST",
      body: data,
    },
    "Profile gagal disimpan.",
  );
}

async function saveVendorProfileForm(endpoint: string, data: FormData) {
  const { userId } = profileContext();
  data.set("userId", String(userId));

  return profileRequest<VendorApiProfile>(
    endpoint,
    {
      method: "POST",
      body: data,
    },
    "Profile vendor gagal disimpan.",
  );
}

async function profileRequest<T>(
  endpoint: string,
  init: RequestInit,
  fallback: string,
  unwrapData = true,
) {
  try {
    return unwrapData
      ? await authenticatedDataRequest<T>(endpoint, init)
      : ((await authenticatedRequest(endpoint, init)) as T);
  } catch (error) {
    throw profileError(error, fallback);
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
