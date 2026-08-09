"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { OtpVerificationForm } from "@/components/forms/OtpVerificationForm";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import {
  AuthError,
  EmailVerificationRequiredError,
  getDashboardRoute,
  login,
  resendOtp,
} from "@/services/authService";
import { ROUTES } from "@/constants/routes";

export function AuthForm() {
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
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {success}
        </p>
      )}
      <AppButton loading={isLoading} type="submit">
        Masuk
      </AppButton>
    </form>
  );
}
