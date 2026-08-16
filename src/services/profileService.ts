import { API_ROUTES } from "@/constants/apiRoutes";
import { getSession } from "@/services/authService";
import { ApiError, apiRequest } from "@/services/api";
import type { ApiResponse } from "@/types/api";
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

export function getCustomerProfile() {
  return getOwnProfile<CustomerApiProfile>(API_ROUTES.profile.customerByUserId);
}

export function getVendorProfile() {
  return getOwnProfile<VendorApiProfile>(API_ROUTES.profile.vendorByUserId);
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
  const { accessToken } = sessionContext();
  try {
    const response = await apiRequest<ApiResponse<VendorApiProfile>>(
      API_ROUTES.profile.vendorById(id),
      {
        method: "PUT",
        headers: authorizationHeader(accessToken),
        body: JSON.stringify(data),
      },
    );
    return response.data;
  } catch (error) {
    throw profileError(error, "Informasi bisnis gagal diperbarui.");
  }
}

export async function saveVendorRelatedData(data: VendorRelatedData) {
  const { accessToken, userId } = sessionContext();
  const headers = authorizationHeader(accessToken);

  for (const contact of data.contacts) {
    const { id, ...payload } = contact;
    await apiRequest(id ? API_ROUTES.contacts.byId(id) : API_ROUTES.contacts.forUser(userId), {
      method: id ? "PUT" : "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  if (data.bankAccount) {
    await apiRequest(
      data.bankAccountId
        ? API_ROUTES.bankAccounts.byId(data.bankAccountId)
        : API_ROUTES.bankAccounts.forUser(userId),
      {
        method: data.bankAccountId ? "PUT" : "POST",
        headers,
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
    await apiRequest(API_ROUTES.verificationDocuments.forUser(userId), {
      method: "POST",
      headers,
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
  const { accessToken } = sessionContext();
  try {
    await apiRequest(endpoint, {
      method: "DELETE",
      headers: authorizationHeader(accessToken),
    });
  } catch (error) {
    throw profileError(error, "Data gagal dihapus.");
  }
}

async function getOwnProfile<T>(endpointForUser: (userId: number) => string) {
  const { accessToken, userId } = sessionContext();

  try {
    const response = await apiRequest<ApiResponse<T>>(endpointForUser(userId), {
      headers: authorizationHeader(accessToken),
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw profileError(error, "Profile gagal dimuat.");
  }
}

async function saveCustomerProfileForm(endpoint: string, data: FormData) {
  const { accessToken, userId } = sessionContext();
  data.set("userId", String(userId));

  try {
    const response = await apiRequest<ApiResponse<CustomerApiProfile>>(endpoint, {
      method: "POST",
      headers: authorizationHeader(accessToken),
      body: data,
    });
    return response.data;
  } catch (error) {
    throw profileError(error, "Profile gagal disimpan.");
  }
}

async function saveVendorProfileForm(endpoint: string, data: FormData) {
  const { accessToken, userId } = sessionContext();
  data.set("userId", String(userId));

  try {
    const response = await apiRequest<ApiResponse<VendorApiProfile>>(endpoint, {
      method: "POST",
      headers: authorizationHeader(accessToken),
      body: data,
    });
    return response.data;
  } catch (error) {
    throw profileError(error, "Profile vendor gagal disimpan.");
  }
}

function sessionContext() {
  const session = getSession();
  if (!session) throw new ProfileError("Sesi login tidak ditemukan. Silakan masuk kembali.");
  return { accessToken: session.accessToken, userId: Number(session.user.id) };
}

function authorizationHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function profileError(error: unknown, fallback: string) {
  if (error instanceof ProfileError) return error;
  if (error instanceof ApiError) return new ProfileError(error.message);
  return new ProfileError(fallback);
}
