import { API_ROUTES } from "@/constants/apiRoutes";
import { getSession } from "@/services/authService";
import { ApiError, apiRequest } from "@/services/api";
import type { ApiResponse } from "@/types/api";
import type {
  CustomerApiProfile,
  CustomerProfilePayload,
  VendorApiProfile,
  VendorProfilePayload,
} from "@/types/profile";

interface ProfilePage<T> {
  data: T[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

export class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileError";
  }
}

export function getCustomerProfile() {
  return getOwnProfile<CustomerApiProfile>(API_ROUTES.profile.customer);
}

export function getVendorProfile() {
  return getOwnProfile<VendorApiProfile>(API_ROUTES.profile.vendor);
}

export function saveCustomerProfile(profileId: number | null, data: CustomerProfilePayload) {
  return saveProfile<CustomerApiProfile>(
    profileId ? API_ROUTES.profile.customerById(profileId) : API_ROUTES.profile.customer,
    profileId,
    data,
  );
}

export function saveVendorProfile(profileId: number | null, data: VendorProfilePayload) {
  return saveProfile<VendorApiProfile>(
    profileId ? API_ROUTES.profile.vendorById(profileId) : API_ROUTES.profile.vendor,
    profileId,
    data,
  );
}

async function getOwnProfile<T extends { user: { id: number } }>(endpoint: string) {
  const { accessToken, userId } = sessionContext();

  try {
    const response = await apiRequest<ApiResponse<ProfilePage<T>>>(
      `${endpoint}?pageNumber=1&pageSize=1000`,
      { headers: authorizationHeader(accessToken) },
    );
    return response.data.data.find((profile) => profile.user.id === userId) ?? null;
  } catch (error) {
    throw profileError(error, "Profile gagal dimuat.");
  }
}

async function saveProfile<T>(
  endpoint: string,
  profileId: number | null,
  data: CustomerProfilePayload | VendorProfilePayload,
) {
  const { accessToken, userId } = sessionContext();

  try {
    const response = await apiRequest<ApiResponse<T>>(endpoint, {
      method: profileId ? "PUT" : "POST",
      headers: authorizationHeader(accessToken),
      body: JSON.stringify(profileId ? data : { userId, ...data }),
    });
    return response.data;
  } catch (error) {
    throw profileError(error, "Profile gagal disimpan.");
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
