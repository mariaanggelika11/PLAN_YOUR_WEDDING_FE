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
  readonly payload?: unknown;
  readonly status: number;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
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
  if (typeof payload === "string" && payload) return translateValidationMessage(payload);
  if (payload instanceof Error && payload.message) return payload.message;
  if (!payload || typeof payload !== "object") return fallback;

  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) {
    const translated = message
      .filter((item): item is string => typeof item === "string")
      .map(translateValidationMessage);
    return [...new Set(translated)].join(" ") || fallback;
  }
  return typeof message === "string" && message ? translateValidationMessage(message) : fallback;
}

const FIELD_LABELS: Record<string, string> = {
  accountHolderName: "nama pemilik rekening",
  accountNumber: "nomor rekening",
  active: "status aktif",
  bankAccount: "rekening bank",
  bankName: "nama bank",
  businessAddress: "alamat bisnis",
  businessEmail: "email bisnis",
  businessName: "nama bisnis",
  businessPhone: "nomor telepon bisnis",
  capacity: "kapasitas tamu",
  category: "kategori",
  contactType: "jenis kontak",
  contactValue: "nilai kontak",
  description: "deskripsi",
  duration: "durasi layanan",
  email: "email",
  eventType: "jenis acara",
  fullName: "nama lengkap",
  guestCapacity: "kapasitas tamu",
  minimumDp: "minimal DP",
  name: "nama produk",
  password: "kata sandi",
  price: "harga",
  serviceArea: "area layanan",
  status: "status",
  terms: "syarat dan ketentuan",
  vendorId: "vendor",
};

export function translateValidationMessage(message: string): string {
  const field = validationField(message);
  const label = FIELD_LABELS[field] ?? humanizeField(field);
  const minimum = message.match(/must not be less than (\d+)/i)?.[1];
  const maximum = message.match(/must not be greater than (\d+)/i)?.[1];

  if (/must be an integer number/i.test(message))
    return `${capitalize(label)} harus berupa angka bulat.`;
  if (/must be a number/i.test(message)) return `${capitalize(label)} harus berupa angka.`;
  if (minimum) return `${capitalize(label)} minimal ${minimum}.`;
  if (maximum) return `${capitalize(label)} maksimal ${maximum}.`;
  if (/should not be empty|must not be empty/i.test(message))
    return `${capitalize(label)} wajib diisi.`;
  if (/must be an email/i.test(message)) return `Format ${label} tidak valid.`;
  if (/must be a valid enum value|must be one of the following values/i.test(message)) {
    return `Pilihan ${label} tidak valid.`;
  }
  if (/property .* should not exist/i.test(message)) {
    return `Data ${label} belum didukung oleh server.`;
  }
  if (/must be a string/i.test(message)) return `${capitalize(label)} harus berupa teks.`;
  if (/must be a boolean/i.test(message))
    return `${capitalize(label)} harus bernilai ya atau tidak.`;
  return message;
}

function validationField(message: string) {
  const unsupportedProperty = message.match(/property ([A-Za-z0-9_]+) should not exist/i)?.[1];
  if (unsupportedProperty) return unsupportedProperty;
  const raw = message.trim().split(/[ .]/)[0] ?? "data";
  return (
    raw
      .replace(/\[?\d+\]?/g, "")
      .split(".")
      .filter(Boolean)
      .at(-1) ?? "data"
  );
}

function humanizeField(field: string) {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
