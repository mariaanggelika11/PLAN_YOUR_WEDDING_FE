"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { RegistrationForm } from "@/features/auth/components/RegistrationForm";
export default function RegisterVendorPage() {
  const { translateText } = useTranslation();
  return (
    <AuthPageLayout
      title={translateText("Daftar sebagai vendor")}
      description={translateText("Lengkapi informasi awal bisnis untuk membuka Seller Center.")}
    >
      <RegistrationForm type="vendor" />
    </AuthPageLayout>
  );
}
