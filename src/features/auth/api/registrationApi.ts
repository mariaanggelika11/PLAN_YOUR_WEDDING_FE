import { encryptText } from "@/features/auth/api/cryptographyApi";
import type {
  CustomerRegistrationData,
  RegistrationResult,
  VendorRegistrationData,
} from "@/features/auth/types/registration";
import { PASSWORD_REGEX, validationMessages } from "@/features/auth/validation";
import { ApiError, apiRequest } from "@/shared/api/apiClient";
import { apiErrorCode } from "@/shared/api/errorCodes";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import type { ApiResponse } from "@/shared/types/api";

type RegistrationKind = "customer" | "vendor";

export class RegistrationError extends Error {
  /** Stable backend error code (e.g. TERMS_OUTDATED), when the API returned one. */
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "RegistrationError";
    this.code = code;
  }
}

export function registerCustomer(data: CustomerRegistrationData) {
  validatePasswords(data.password, data.confirmPassword);
  return register("customer", data.termsVersionId, {
    fullname: data.fullname.trim(),
    email: normalizeEmail(data.email),
    phoneNumber: data.phoneNumber.trim(),
    password: data.password,
  });
}

export function registerVendor(data: VendorRegistrationData) {
  validatePasswords(data.password, data.confirmPassword);
  return register("vendor", data.termsVersionId, {
    ownerName: data.ownerName.trim(),
    businessName: data.businessName.trim(),
    email: normalizeEmail(data.email),
    businessPhone: data.businessPhone.trim(),
    businessAddress: data.businessAddress.trim(),
    password: data.password,
  });
}

async function register(
  kind: RegistrationKind,
  termsVersionId: number,
  data: Record<string, string> & { password: string },
): Promise<RegistrationResult> {
  try {
    const cipherText = await encryptText(data.password);
    const { password: _plainPassword, ...profileData } = data;

    const response = await apiRequest<ApiResponse<RegistrationResult>>(API_ROUTES.register[kind], {
      method: "POST",
      body: JSON.stringify({
        ...profileData,
        password: cipherText,
        confirmPassword: cipherText,
        acceptedTerms: true,
        termsVersionId,
      }),
    });

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw new RegistrationError(error.message, apiErrorCode(error));
    throw new RegistrationError("Registrasi gagal. Silakan coba kembali.");
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validatePasswords(password: string, confirmPassword: string) {
  if (!PASSWORD_REGEX.test(password)) throw new RegistrationError(validationMessages.password);
  if (password !== confirmPassword) {
    throw new RegistrationError(validationMessages.confirmPassword);
  }
}
