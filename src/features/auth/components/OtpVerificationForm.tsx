"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";

import { AuthError, resendOtp, verifyOtp } from "@/features/auth/api/authApi";
import type { OtpPurpose } from "@/features/auth/types/auth";
import { PopupMessage } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/FormFields";
import { useEffect, useState, type FormEvent } from "react";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

interface OtpVerificationFormProps {
  email: string;
  purpose: OtpPurpose;
  onVerified: () => void;
  onChangeEmail?: () => void;
}

export function OtpVerificationForm({
  email,
  purpose,
  onVerified,
  onChangeEmail,
}: OtpVerificationFormProps) {
  const { translateText } = useTranslation();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otpCode = String(new FormData(event.currentTarget).get("otpCode") ?? "").trim();
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otpCode)) {
      setError(translateText("Kode OTP harus terdiri dari {0} digit.", { 0: OTP_LENGTH }));
      return;
    }

    setError("");
    setMessage("");
    setIsVerifying(true);
    try {
      await verifyOtp(email, otpCode, purpose);
      onVerified();
    } catch (submitError) {
      setError(errorMessage(submitError, "Kode OTP gagal diverifikasi."));
    } finally {
      setIsVerifying(false);
    }
  }

  async function resend() {
    setError("");
    setMessage("");
    setIsResending(true);
    try {
      await resendOtp(email, purpose);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage("Kode OTP baru telah dikirim. Periksa kembali email Anda.");
    } catch (resendError) {
      setError(errorMessage(resendError, "Kode OTP gagal dikirim ulang."));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="rounded-xl bg-rose-50 p-3 text-sm text-stone-700">
        {translateText("Permintaan kode OTP 6 digit telah diterima untuk")} <strong>{email}</strong>
        {translateText(". Periksa inbox dan folder spam. Kode berlaku dalam waktu terbatas.")}{" "}
      </div>

      <AppInput
        label={translateText("Kode OTP")}
        name="otpCode"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        pattern={`\\d{${OTP_LENGTH}}`}
        placeholder="123456"
        required
      />

      {error && <Feedback>{translateText(error)}</Feedback>}
      {message && <PopupMessage message={message} />}

      <AppButton loading={isVerifying} type="submit">
        {translateText("Verifikasi OTP")}{" "}
      </AppButton>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          className="font-semibold text-blush disabled:cursor-not-allowed disabled:text-stone-600"
          disabled={cooldown > 0 || isResending || isVerifying}
          onClick={resend}
          type="button"
        >
          {isResending
            ? translateText("Mengirim ulang...")
            : cooldown > 0
              ? translateText("Kirim ulang ({0} detik)", { 0: cooldown })
              : translateText("Kirim ulang OTP")}
        </button>
        {onChangeEmail && (
          <button className="text-stone-600 hover:text-blush" onClick={onChangeEmail} type="button">
            {translateText("Ganti email")}{" "}
          </button>
        )}
      </div>
    </form>
  );
}

function Feedback({ children }: { children: React.ReactNode }) {
  return <PopupMessage message={String(children)} variant="error" />;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof AuthError ? error.message : fallback;
}
