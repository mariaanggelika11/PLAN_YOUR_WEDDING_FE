import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import { CustomerPersonalSections } from "@/features/profile/components/customer/PersonalProfileSections";
import { CustomerWeddingDetailsSection } from "@/features/profile/components/customer/WeddingDetailsSection";
import type { CustomerApiProfile } from "@/features/profile/types";

export function CustomerProfileSections({
  activeStep,
  masterParameters,
  profile,
}: {
  activeStep: number;
  masterParameters: ReturnType<typeof useMasterParameters>;
  profile: CustomerApiProfile | null;
}) {
  return (
    <>
      <CustomerPersonalSections activeStep={activeStep} profile={profile} />
      <CustomerWeddingDetailsSection
        active={activeStep === 3}
        masterParameters={masterParameters}
        profile={profile}
      />
    </>
  );
}
