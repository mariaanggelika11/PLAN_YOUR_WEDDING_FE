import type { User, UserRole } from "./index";

export type { UserRole };

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt?: string;
}

export type OtpPurpose = "register" | "forgot_password";

export interface OtpDeliveryResult {
  email: string;
  purpose: OtpPurpose;
  sent: boolean;
}

export interface OtpVerificationResult {
  email: string;
  purpose: OtpPurpose;
  verified: boolean;
}

export interface ChangePasswordData {
  email: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResult {
  email: string;
  changed: boolean;
}
