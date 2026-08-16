export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend-api";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.", 0);
  }

  const payload = await readResponseBody(response);
  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload), response.status, payload);
  }

  return payload as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function getErrorMessage(payload: unknown, fallback = "Permintaan API gagal."): string {
  if (typeof payload === "string" && payload) return payload;
  if (payload instanceof Error && payload.message) return payload.message;
  if (!payload || typeof payload !== "object") return fallback;

  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) return message.filter((item) => typeof item === "string").join(" ");
  return typeof message === "string" && message ? message : fallback;
}
