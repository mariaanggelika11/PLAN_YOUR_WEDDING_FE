import { API_ROUTES } from "@/constants/apiRoutes";
import { ApiError } from "@/services/api";
import { authenticatedDataRequest, getAuthenticatedContext } from "@/services/authenticatedApi";

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
  try {
    return await authenticatedDataRequest<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError) throw new AccountError(error.message);
    throw new AccountError("Data akun gagal diproses.");
  }
}
