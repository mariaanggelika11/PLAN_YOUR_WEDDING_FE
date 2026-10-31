import type {
  CreateTermsVersionInput,
  TermsDocument,
  TermsStatus,
  TermsUserType,
  TermsVersionSummary,
  UserTermsAcceptance,
} from "@/features/terms/types";
import { apiRequest } from "@/shared/api/apiClient";
import { featureDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import type { ApiResponse } from "@/shared/types/api";

/** Public: used by the registration page before the user has an account. */
export async function getActiveTerms(type: TermsUserType) {
  const response = await apiRequest<ApiResponse<TermsDocument>>(API_ROUTES.terms.active(type));
  return response.data;
}

export function getMyTermsStatus() {
  return featureDataRequest<TermsStatus>(API_ROUTES.terms.myStatus);
}

export function acceptTerms(termsVersionId: number) {
  return featureDataRequest<UserTermsAcceptance>(
    API_ROUTES.terms.accept,
    { method: "POST", body: JSON.stringify({ termsVersionId }) },
    "Persetujuan syarat dan ketentuan gagal disimpan.",
  );
}

export function getTermsVersions() {
  return featureDataRequest<TermsVersionSummary[]>(API_ROUTES.terms.root);
}

export function getTermsVersion(id: number) {
  return featureDataRequest<TermsDocument>(API_ROUTES.terms.byId(id));
}

export function createTermsVersion(input: CreateTermsVersionInput) {
  return featureDataRequest<TermsDocument>(
    API_ROUTES.terms.root,
    { method: "POST", body: JSON.stringify(input) },
    "Versi syarat dan ketentuan gagal dibuat.",
  );
}

export function activateTermsVersion(id: number) {
  return featureDataRequest<TermsDocument>(
    API_ROUTES.terms.activate(id),
    { method: "PUT" },
    "Versi syarat dan ketentuan gagal diaktifkan.",
  );
}
