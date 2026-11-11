import { withRequestDeadline } from "./requestDeadline";
import { expireSession, getSession } from "@/features/auth/api/authApi";
import { API_BASE_URL, ApiError, apiRequest, requestFailure } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/types/api";

export function getAuthenticatedContext() {
  const session = getSession();
  if (!session) throw new ApiError("Sesi login tidak ditemukan. Silakan masuk kembali.", 401);
  return {
    accessToken: session.accessToken,
    userId: Number(session.user.id),
  };
}

export async function authenticatedRequest<T>(path: string, init?: RequestInit) {
  const { accessToken } = getAuthenticatedContext();
  try {
    return await apiRequest<T>(path, {
      ...init,
      headers: withBearerToken(init?.headers, accessToken),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) expireSession();
    throw error;
  }
}

export async function authenticatedDataRequest<T>(path: string, init?: RequestInit) {
  const response = await authenticatedRequest<ApiResponse<T>>(path, init);
  return response.data;
}

/** Executes an authenticated feature request while keeping API error messages intact. */
export async function featureDataRequest<T>(
  path: string,
  init?: RequestInit,
  fallbackMessage = "Permintaan gagal diproses.",
) {
  try {
    return await authenticatedDataRequest<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(fallbackMessage, 0, error);
  }
}

export async function authenticatedFetch(path: string, init?: RequestInit) {
  const { accessToken } = getAuthenticatedContext();
  try {
    return await withRequestDeadline(async (signal) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        signal,
        headers: withBearerToken(init?.headers, accessToken),
      });
      if (response.status === 401) expireSession();
      // Attachment callers consume a blob; buffer it while the deadline remains active.
      const body =
        response.status === 204 || response.status === 205 || response.status === 304
          ? null
          : await response.arrayBuffer();
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }, init);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw requestFailure(error, init?.signal);
  }
}

function withBearerToken(headers: HeadersInit | undefined, accessToken: string) {
  const authenticatedHeaders = new Headers(headers);
  authenticatedHeaders.set("Authorization", `Bearer ${accessToken}`);
  return authenticatedHeaders;
}
