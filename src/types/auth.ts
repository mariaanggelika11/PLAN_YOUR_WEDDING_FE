import type { User, UserRole } from "./index";

export type { UserRole };

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt?: string;
}
