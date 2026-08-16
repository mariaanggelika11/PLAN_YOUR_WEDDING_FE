import { FormSection } from "@/features/profile/components/shared/ProfileFormFields";
import type { ReactNode } from "react";

interface StepSectionProps {
  active: boolean;
  children: ReactNode;
}

export function WeddingDetailsSection({ active, children }: StepSectionProps) {
  return (
    <FormSection
      active={active}
      description="Lengkapi detail acara agar rekomendasi vendor dan perencanaan wedding lebih relevan."
      step={3}
      title="Detail pernikahan"
    >
      {children}
    </FormSection>
  );
}

export function BusinessInformationSection({ active, children }: StepSectionProps) {
  return (
    <FormSection
      active={active}
      description="Lengkapi identitas bisnis, lokasi, cakupan layanan, kategori, dan logo brand."
      step={1}
      title="Informasi bisnis"
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
  return (
    <FormSection
      active={active}
      description="Lengkapi dokumen legal bisnis Anda."
      step={3}
      title="Dokumen verifikasi"
    >
      {children}
    </FormSection>
  );
}
