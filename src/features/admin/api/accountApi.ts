import { featureDataRequest, getAuthenticatedContext } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";

export interface AccountProfile {
  id: number;
  fullname: string;
  email: string;
  phoneNumber?: string | null;
  active: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export function getAccountProfile() {
  const { userId } = getAuthenticatedContext();
  return request<AccountProfile>(API_ROUTES.users.byId(userId));
}

export function saveAccountProfile(
  data: Pick<AccountProfile, "fullname" | "email" | "phoneNumber">,
) {
  const { userId } = getAuthenticatedContext();
  return request<AccountProfile>(API_ROUTES.users.byId(userId), {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function request<T>(path: string, init?: RequestInit) {
  return featureDataRequest<T>(path, init, "Data akun gagal diproses.");
}
