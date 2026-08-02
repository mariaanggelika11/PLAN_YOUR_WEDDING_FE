import { API_ROUTES } from "@/constants/apiRoutes";
import { ApiError, apiRequest } from "@/services/api";
import { getSession } from "@/services/authService";
import type { ApiResponse } from "@/types/api";

export interface AccountProfile {
  id: number;
  fullname: string;
  email: string;
  phoneNumber?: string | null;
  active: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export class AccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountError";
  }
}

export function getAccountProfile() {
  const session = requireSession();
  return request<AccountProfile>(
    API_ROUTES.users.byId(Number(session.user.id)),
    session.accessToken,
  );
}

export function saveAccountProfile(
  data: Pick<AccountProfile, "fullname" | "email" | "phoneNumber">,
) {
  const session = requireSession();
  return request<AccountProfile>(
    API_ROUTES.users.byId(Number(session.user.id)),
    session.accessToken,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

async function request<T>(path: string, accessToken: string, init?: RequestInit) {
  try {
    const response = await apiRequest<ApiResponse<T>>(path, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw new AccountError(error.message);
    throw new AccountError("Data akun gagal diproses.");
  }
}

function requireSession() {
  const session = getSession();
  if (!session) throw new AccountError("Sesi login tidak ditemukan. Silakan masuk kembali.");
  return session;
}
