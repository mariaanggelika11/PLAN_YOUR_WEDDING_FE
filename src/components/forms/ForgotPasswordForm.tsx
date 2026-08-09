"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { OtpVerificationForm } from "@/components/forms/OtpVerificationForm";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { SuccessState } from "@/components/states/States";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import { ROUTES } from "@/constants/routes";
import { AuthError, changePassword, requestPasswordReset } from "@/services/authService";
import { PASSWORD_REGEX, validationMessages } from "@/utils/validation";

type ResetStep = "email" | "otp" | "password" | "success";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedEmail = normalizeEmail(
      String(new FormData(event.currentTarget).get("email") ?? ""),
    );
    if (!submittedEmail) return setError("Email wajib diisi.");

    setError("");
    setIsLoading(true);
    try {
      const result = await requestPasswordReset(submittedEmail);
      setEmail(result.email);
      setStep("otp");
    } catch (requestError) {
      setError(errorMessage(requestError, "Kode OTP gagal dikirim."));
    } finally {
      setIsLoading(false);
    }
  }

  async function submitNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmNewPassword = String(form.get("confirmNewPassword") ?? "");

    if (!PASSWORD_REGEX.test(newPassword)) return setError(validationMessages.password);
    if (newPassword !== confirmNewPassword) return setError(validationMessages.confirmPassword);

    setError("");
    setIsLoading(true);
    try {
      await changePassword({ email, newPassword, confirmNewPassword });
      setStep("success");
    } catch (changeError) {
      setError(errorMessage(changeError, "Password gagal diubah."));
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <OtpVerificationForm
        email={email}
        purpose="forgot_password"
        onChangeEmail={() => {
          setError("");
          setStep("email");
        }}
        onVerified={() => setStep("password")}
      />
    );
  }

  if (step === "password") {
    return (
      <form className="grid gap-4" onSubmit={submitNewPassword}>
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-stone-700">
          OTP berhasil diverifikasi. Buat password baru untuk <strong>{email}</strong>.
        </p>
        <PasswordInput
          label="Password baru"
          name="newPassword"
          helper={validationMessages.password}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          label="Konfirmasi password baru"
          name="confirmNewPassword"
          autoComplete="new-password"
          required
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <AppButton loading={isLoading} type="submit">
          Ubah password
        </AppButton>
      </form>
    );
  }

  if (step === "success") {
    return (
      <div className="grid gap-4">
        <SuccessState message="Password berhasil diubah. Silakan masuk menggunakan password baru." />
        <AppButton asChild>
          <Link href={ROUTES.login}>Kembali ke halaman masuk</Link>
        </AppButton>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={requestOtp}>
      <AppInput
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        autoComplete="email"
        defaultValue={email}
        required
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <AppButton loading={isLoading} type="submit">
        Kirim kode OTP
      </AppButton>
    </form>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      {children}
    </p>
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof AuthError ? error.message : fallback;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
