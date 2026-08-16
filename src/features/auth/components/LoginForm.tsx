"use client";
import {
  AuthError,
  EmailVerificationRequiredError,
  getDashboardRoute,
  login,
  resendOtp,
} from "@/features/auth/api/authApi";
import { OtpVerificationForm } from "@/features/auth/components/OtpVerificationForm";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { PopupMessage } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/FormFields";
import { ROUTES } from "@/shared/config/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!form.get("email")) return setError("Email wajib diisi.");
    if (String(form.get("password") ?? "").length < 8)
      return setError("Password minimal 8 karakter.");
    setError("");
    setIsLoading(true);
    try {
      const session = await login({
        email: String(form.get("email")),
        password: String(form.get("password")),
        rememberMe: form.get("rememberMe") === "on",
      });
      setSuccess("Login berhasil. Mengarahkan ke dashboard...");
      router.replace(getDashboardRoute(session.user.role));
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof EmailVerificationRequiredError) {
        try {
          await resendOtp(submitError.email, "register");
          setUnverifiedEmail(submitError.email);
          setError("");
        } catch (resendError) {
          setError(
            resendError instanceof AuthError
              ? resendError.message
              : "Email belum diverifikasi dan kode OTP gagal dikirim. Silakan coba kembali.",
          );
        }
        return;
      }
      setError(
        submitError instanceof AuthError
          ? submitError.message
          : "Login gagal. Silakan coba kembali.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (unverifiedEmail) {
    return (
      <div className="grid gap-4">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Email Anda belum diverifikasi. Kode OTP baru telah dikirim secara otomatis ke email Anda.
        </p>
        <OtpVerificationForm
          email={unverifiedEmail}
          purpose="register"
          onChangeEmail={() => {
            setUnverifiedEmail("");
            setSuccess("");
          }}
          onVerified={() => {
            setUnverifiedEmail("");
            setSuccess("Email berhasil diverifikasi. Silakan masuk kembali.");
          }}
        />
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <AppInput
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        autoComplete="email"
        required
      />
      <PasswordInput
        label="Password"
        name="password"
        placeholder="Masukkan password"
        helper="Minimal 8 karakter."
        autoComplete="current-password"
        required
      />
      <div className="flex justify-between text-sm">
        <label className="flex gap-2">
          <input name="rememberMe" type="checkbox" className="accent-rose-600" /> Ingat saya
        </label>
        <Link className="text-blush" href={ROUTES.forgotPassword}>
          Lupa password?
        </Link>
      </div>
      {error && <PopupMessage message={error} variant="error" />}
      {success && <PopupMessage message={success} />}
      <AppButton loading={isLoading} type="submit">
        Masuk
      </AppButton>
    </form>
  );
}
