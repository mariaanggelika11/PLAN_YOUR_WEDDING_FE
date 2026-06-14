export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

// TODO API: Tambahkan interceptor JWT, refresh token, dan normalisasi error backend.
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) throw new Error("Permintaan API gagal.");
  return response.json() as Promise<T>;
}
