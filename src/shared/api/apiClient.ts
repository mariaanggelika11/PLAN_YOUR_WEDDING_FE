import { captureApiFailure } from "../monitoring/client.ts";
import { browserLocale } from "../i18n/browserLocale.ts";
import { translateValidationKey } from "../i18n/validationMessages.ts";
import type { AppLocale } from "../i18n/locale.ts";
import { RequestTimeoutError, withRequestDeadline } from "./requestDeadline.ts";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend-api";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    return await withRequestDeadline(async (signal) => {
      const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal });
      const payload = await readResponseBody(response);
      if (!response.ok) throw new ApiError(getErrorMessage(payload), response.status, payload);
      return payload as T;
    }, init);
  } catch (error) {
    const failure = error instanceof ApiError ? error : requestFailure(error, init?.signal);
    captureApiFailure(failure.status, (failure.payload as { code?: string } | undefined)?.code);
    throw failure;
  }
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

export function requestFailure(error: unknown, signal?: AbortSignal | null) {
  if (error instanceof RequestTimeoutError) {
    return new ApiError(
      "Permintaan melewati batas waktu. Periksa status terbaru sebelum mencoba lagi.",
      0,
      { code: "REQUEST_TIMEOUT" },
    );
  }
  if (signal?.aborted)
    return new ApiError("Permintaan dibatalkan.", 0, { code: "REQUEST_ABORTED" });
  return new ApiError("Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.", 0, {
    code: "NETWORK_ERROR",
  });
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

export function getErrorMessage(
  payload: unknown,
  fallback = "Permintaan API gagal.",
  locale: AppLocale = browserLocale(),
): string {
  if (typeof payload === "string" && payload) return translateValidationMessage(payload, locale);
  if (payload instanceof Error && payload.message) return payload.message;
  if (!payload || typeof payload !== "object") return fallback;

  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) {
    const translated = message
      .filter((item): item is string => typeof item === "string")
      .map((message) => translateValidationMessage(message, locale));
    return [...new Set(translated)].join(" ") || fallback;
  }
  return typeof message === "string" && message
    ? translateValidationMessage(message, locale)
    : fallback;
}

const FIELD_LABELS = {
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
  termsVersionId: "versi syarat dan ketentuan",
  vendorId: "vendor",
} as const;

export function translateValidationMessage(message: string, locale: AppLocale = "id"): string {
  const field = validationField(message);
  const knownField = Object.hasOwn(FIELD_LABELS, field);
  const label = knownField
    ? translateValidationKey(`validationFields.${field as keyof typeof FIELD_LABELS}`, locale)
    : humanizeField(field);
  const minimum = message.match(/must not be less than (\d+)/i)?.[1];
  const maximum = message.match(/must not be greater than (\d+)/i)?.[1];
  const values = { field: capitalize(label) };
  if (/must be an integer number/i.test(message))
    return translateValidationKey("validation.integer", locale, values);
  if (/must be a number/i.test(message))
    return translateValidationKey("validation.number", locale, values);
  if (minimum)
    return translateValidationKey("validation.minimum", locale, { ...values, value: minimum });
  if (maximum)
    return translateValidationKey("validation.maximum", locale, { ...values, value: maximum });
  if (/should not be empty|must not be empty/i.test(message))
    return translateValidationKey("validation.required", locale, values);
  if (/must be an email/i.test(message))
    return translateValidationKey("validation.email", locale, { field: label });
  if (/must be a valid enum value|must be one of the following values/i.test(message))
    return translateValidationKey("validation.enum", locale, { field: label });
  if (/property .* should not exist/i.test(message))
    return translateValidationKey("validation.unsupported", locale, { field: label });
  if (/must be a string/i.test(message))
    return translateValidationKey("validation.string", locale, values);
  if (/must be a boolean/i.test(message))
    return translateValidationKey("validation.boolean", locale, values);
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
