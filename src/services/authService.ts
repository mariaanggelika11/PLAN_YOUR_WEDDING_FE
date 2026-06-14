import { mockUsers } from "@/constants/mockData";
import type { AuthSession, LoginCredentials } from "@/types/auth";
import type { User, UserRole } from "@/types";

const SESSION_KEY = "pyw_auth_session";
const MOCK_PASSWORD = "Wedding123";

export class AuthError extends Error {}

// TODO API: Ganti mock login dengan POST /auth/login dan simpan JWT + refresh token secara aman.
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  await wait(600);
  const user = mockUsers.find(
    (item) => item.email.toLowerCase() === credentials.email.toLowerCase(),
  );
  if (!user || credentials.password !== MOCK_PASSWORD)
    throw new AuthError("Email atau password tidak sesuai.");
  if (user.status === "SUSPENDED")
    throw new AuthError("Akun Anda sedang ditangguhkan. Hubungi administrator.");

  const session: AuthSession = {
    user,
    accessToken: `mock-access-token-${user.id}`,
    refreshToken: `mock-refresh-token-${user.id}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
  persistSession(session, credentials.rememberMe);
  return session;
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  document.cookie = "pyw_role=; path=/; max-age=0; samesite=lax";
  window.dispatchEvent(new Event("pyw-auth-change"));
}

export function getDashboardRoute(role: UserRole) {
  return role === "ADMIN"
    ? "/admin/dashboard"
    : role === "VENDOR"
      ? "/vendor/dashboard"
      : "/customer/dashboard";
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO API: Kirim data registrasi customer ke backend
export async function registerCustomer(): Promise<User> {
  return mockUsers[0];
}
// TODO API: Kirim data registrasi vendor ke backend
export async function registerVendor(): Promise<User> {
  return mockUsers[1];
}
