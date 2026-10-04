"use client";

import { PortfolioEditor } from "@/features/profile/components/portfolio/Portfolio";
import { ProfileFormController } from "@/features/profile/components/ProfileFormController";

export function VendorProfileForm() {
  return (
    <div className="grid gap-6">
      <ProfileFormController type="vendor" />
      <PortfolioEditor />
    </div>
  );
}
