"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
export default function ForgotPasswordPage() {
  const { translateText } = useTranslation();
  return (
    <AuthPageLayout
      title={translateText("Atur ulang password")}
      description={translateText(
        "Masukkan email akun Anda. Kami akan mengirim kode OTP untuk mengatur ulang password.",
      )}
    >
      <ForgotPasswordForm />
    </AuthPageLayout>
  );
}
