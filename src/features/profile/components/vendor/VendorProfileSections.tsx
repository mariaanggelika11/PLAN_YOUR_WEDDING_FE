import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import { FormSection } from "@/features/profile/components/shared/ProfileFormFields";
import { VendorBankAccountSection } from "@/features/profile/components/vendor/BankAccountSection";
import { VendorBusinessInformationSection } from "@/features/profile/components/vendor/BusinessInformationSection";
import { VendorContactSection } from "@/features/profile/components/vendor/ContactSection";
import { VendorVerificationDocumentSection } from "@/features/profile/components/vendor/VerificationDocumentSection";
import type { VendorApiProfile } from "@/features/profile/types";
import { AppInput } from "@/shared/components/ui/FormFields";

export function VendorProfileSections({
  activeStep,
  canEditBusiness,
  canEditCore,
  canEditOperations,
  masterParameters,
  onDataChanged,
  profile,
}: {
  activeStep: number;
  canEditBusiness: boolean;
  canEditCore: boolean;
  canEditOperations: boolean;
  masterParameters: ReturnType<typeof useMasterParameters>;
  onDataChanged: () => void;
  profile: VendorApiProfile | null;
}) {
  return (
    <>
      <FormSection
        active={activeStep === 0}
        description="Data pemilik utama bisnis."
        step={0}
        title="Pemilik"
      >
        <fieldset className="contents" disabled={!canEditCore}>
          <AppInput
            defaultValue={profile?.ownerName ?? ""}
            label="Nama pemilik"
            maxLength={100}
            name="ownerName"
            required
          />
        </fieldset>
      </FormSection>
      <VendorBusinessInformationSection
        active={activeStep === 1}
        canEditBusiness={canEditBusiness}
        canEditOperations={canEditOperations}
        masterParameters={masterParameters}
        profile={profile}
      />
      <FormSection
        active={activeStep === 2}
        description="Kelola kanal kontak bisnis dan rekening pencairan dalam satu tempat."
        step={2}
        title="Kontak dan rekening"
      >
        <fieldset className="contents" disabled={!canEditOperations}>
          <VendorContactSection onDeleted={onDataChanged} profile={profile} />
          <VendorBankAccountSection onDeleted={onDataChanged} profile={profile} />
        </fieldset>
      </FormSection>
      <VendorVerificationDocumentSection
        active={activeStep === 3}
        canEdit={canEditCore}
        profile={profile}
      />
    </>
  );
}
