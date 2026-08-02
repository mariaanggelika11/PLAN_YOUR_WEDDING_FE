import { API_ROUTES } from "@/constants/apiRoutes";
import { dashboardRoute } from "@/constants/routes";
import { ApiError, apiRequest } from "@/services/api";
import { encryptText } from "@/services/cryptographyService";
import type { ApiResponse } from "@/types/api";
import type { AuthSession, LoginCredentials } from "@/types/auth";
import type { UserRole } from "@/types";

const SESSION_KEY = "pyw_auth_session";

interface BackendRole {
  id: number;
  roleName: string;
}

interface BackendLoginData {
  access_token: string;
  user: {
    id: number;
    email: string;
    fullname: string;
  };
  roles: BackendRole | null;
  listRoles: BackendRole[];
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  try {
    const cipherText = await encryptText(credentials.password);

    const loginResponse = await apiRequest<ApiResponse<BackendLoginData>>(API_ROUTES.auth.login, {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: cipherText,
      }),
    });

    const backendSession = loginResponse.data;
    const role = mapBackendRole(backendSession.roles?.roleName);
    const session: AuthSession = {
      user: {
        id: String(backendSession.user.id),
        name: backendSession.user.fullname,
        email: backendSession.user.email,
        role,
        status: "ACTIVE",
      },
      accessToken: backendSession.access_token,
      expiresAt: getJwtExpiry(backendSession.access_token),
    };

    persistSession(session, credentials.rememberMe);
    return session;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    if (error instanceof ApiError) {
      if (error.status === 401) throw new AuthError("Email atau password tidak sesuai.");
      throw new AuthError(error.message);
    }
    throw new AuthError("Login gagal. Silakan coba kembali.");
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.accessToken || !session.user?.role) throw new Error("Invalid session");
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export async function logout(): Promise<void> {
  const accessToken = getSession()?.accessToken;

  try {
    await apiRequest<ApiResponse<null>>(API_ROUTES.auth.logout, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
  } finally {
    clearSession();
    if (typeof window !== "undefined") window.dispatchEvent(new Event("pyw-auth-change"));
  }
}

export function getDashboardRoute(role: UserRole) {
  return dashboardRoute(role.toLowerCase() as "admin" | "vendor" | "customer");
}

function mapBackendRole(roleName?: string): UserRole {
  const normalized = roleName
    ?.trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "ADMIN" || normalized === "ADMINISTRATOR") return "ADMIN";
  if (normalized === "VENDOR") return "VENDOR";
  if (normalized === "CUSTOMER") return "CUSTOMER";
  if (!normalized) throw new AuthError("Akun belum memiliki role utama.");
  throw new AuthError(`Role utama \"${roleName}\" belum didukung oleh aplikasi.`);
}

function persistSession(session: AuthSession, rememberMe: boolean) {
  if (typeof window === "undefined") return;
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;
  otherStorage.removeItem(SESSION_KEY);
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  document.cookie = `pyw_role=${session.user.role}; path=/; samesite=lax${rememberMe ? "; max-age=2592000" : ""}`;
  window.dispatchEvent(new Event("pyw-auth-change"));
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  document.cookie = "pyw_role=; path=/; max-age=0; samesite=lax";
}

function getJwtExpiry(token: string): string | undefined {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return undefined;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    return payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined;
  } catch {
    return undefined;
  }
}
