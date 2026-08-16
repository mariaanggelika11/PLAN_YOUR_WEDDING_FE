import { API_BASE_URL, ApiError, apiRequest } from "@/services/api";
import { getSession } from "@/services/authService";
import type { ApiResponse } from "@/types/api";

export function getAuthenticatedContext() {
  const session = getSession();
  if (!session) throw new ApiError("Sesi login tidak ditemukan. Silakan masuk kembali.", 401);
  return {
    accessToken: session.accessToken,
    userId: Number(session.user.id),
  };
}

export function authenticatedRequest<T>(path: string, init?: RequestInit) {
  const { accessToken } = getAuthenticatedContext();
  return apiRequest<T>(path, {
    ...init,
    headers: withBearerToken(init?.headers, accessToken),
  });
}

export async function authenticatedDataRequest<T>(path: string, init?: RequestInit) {
  const response = await authenticatedRequest<ApiResponse<T>>(path, init);
  return response.data;
}

export async function authenticatedFetch(path: string, init?: RequestInit) {
  const { accessToken } = getAuthenticatedContext();
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: withBearerToken(init?.headers, accessToken),
    });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server.", 0);
  }
}

function withBearerToken(headers: HeadersInit | undefined, accessToken: string) {
  const authenticatedHeaders = new Headers(headers);
  authenticatedHeaders.set("Authorization", `Bearer ${accessToken}`);
  return authenticatedHeaders;
}
