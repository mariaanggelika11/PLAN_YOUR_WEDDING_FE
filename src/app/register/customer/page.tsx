"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { RegistrationForm } from "@/features/auth/components/RegistrationForm";
export default function RegisterCustomerPage() {
  const { translateText } = useTranslation();
  return (
    <AuthPageLayout
      title={translateText("Daftar sebagai customer")}
      description={translateText("Mulai susun rencana wedding bersama vendor terpercaya.")}
    >
      <RegistrationForm type="customer" />
    </AuthPageLayout>
  );
}
