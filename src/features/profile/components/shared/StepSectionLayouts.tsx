"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { FormSection } from "@/features/profile/components/shared/ProfileFormFields";
import type { ReactNode } from "react";

interface StepSectionProps {
  active: boolean;
  children: ReactNode;
}

export function WeddingDetailsSection({ active, children }: StepSectionProps) {
  const { translateText } = useTranslation();
  return (
    <FormSection
      active={active}
      description={translateText(
        "Lengkapi detail acara agar rekomendasi vendor dan perencanaan wedding lebih relevan.",
      )}
      step={3}
      title={translateText("Detail pernikahan")}
    >
      {children}
    </FormSection>
  );
}

export function BusinessInformationSection({ active, children }: StepSectionProps) {
  const { translateText } = useTranslation();
  return (
    <FormSection
      active={active}
      description={translateText(
        "Lengkapi identitas bisnis, lokasi, cakupan layanan, kategori, dan logo brand.",
      )}
      step={1}
      title={translateText("Informasi bisnis")}
    >
      {children}
    </FormSection>
  );
}

export function ContactSection({ children }: { children: ReactNode }) {
  return <div className="contents">{children}</div>;
}

export function BankAccountSection({ children }: { children: ReactNode }) {
  return <div className="contents">{children}</div>;
}

export function VerificationDocumentSection({ active, children }: StepSectionProps) {
  const { translateText } = useTranslation();
  return (
    <FormSection
      active={active}
      description={translateText("Lengkapi dokumen legal bisnis Anda.")}
      step={3}
      title={translateText("Dokumen verifikasi")}
    >
      {children}
    </FormSection>
  );
}
