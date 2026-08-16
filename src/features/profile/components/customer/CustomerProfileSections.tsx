import { CustomerPersonalSections } from "@/features/profile/components/customer/PersonalProfileSections";
import { CustomerWeddingDetailsSection } from "@/features/profile/components/customer/WeddingDetailsSection";
import { useMasterParameters } from "@/hooks/useMasterParameters";
import type { CustomerApiProfile } from "@/types/profile";

export function CustomerProfileSections({
  activeStep,
  masterParameters,
  onDataChanged,
  profile,
}: {
  activeStep: number;
  masterParameters: ReturnType<typeof useMasterParameters>;
  onDataChanged: () => void;
  profile: CustomerApiProfile | null;
}) {
  return (
    <>
      <CustomerPersonalSections
        activeStep={activeStep}
        onDataChanged={onDataChanged}
        profile={profile}
      />
      <CustomerWeddingDetailsSection
        active={activeStep === 3}
        masterParameters={masterParameters}
        profile={profile}
      />
    </>
  );
}
