"use client";

import { useCallback } from "react";
import { useProfileData } from "@/components/providers/ProfileProvider";
import { replaceVendorLogo } from "@/services/attachmentService";
import {
  formFile,
  vendorFormToBusinessPayload,
  vendorFormToPayload,
  vendorFormToRelatedData,
} from "@/features/profile/mappers/profileMappers";
import {
  saveVendorProfileDraft,
  saveVendorRelatedData,
  submitVendorProfile,
  updateVendorProfile,
} from "@/services/profileService";
import type { VendorApiProfile } from "@/types/profile";

export function useVendorProfileForm(enabled = true) {
  const resource = useProfileData("vendor", enabled);

  const reloadAndNotify = useCallback(async () => {
    return resource.reload();
  }, [resource.reload]);

  const saveProfile = useCallback(
    async (
      action: "draft" | "submit",
      form: HTMLFormElement,
      currentProfile: VendorApiProfile | null,
    ) => {
      const payload = vendorFormToPayload(form);
      const saved =
        action === "draft"
          ? await saveVendorProfileDraft(payload)
          : await submitVendorProfile(payload);
      const related = vendorFormToRelatedData(form, currentProfile);
      const savedWithRelations = await saveVendorRelatedData(related);
      let profile = savedWithRelations ?? saved;
      resource.setData(profile);

      let logoUploadFailed = false;
      const logoFile = formFile(form, "logoFile");
      if (logoFile) {
        try {
          await replaceVendorLogo(saved.id, logoFile);
          profile = (await resource.reload()) ?? profile;
        } catch {
          logoUploadFailed = true;
        }
      }
      return { logoUploadFailed, profile, uploadedDocument: Boolean(related.verificationDocument) };
    },
    [resource.reload, resource.setData],
  );

  const saveVerifiedProfile = useCallback(
    async (activeStep: number, form: HTMLFormElement, currentProfile: VendorApiProfile) => {
      if (activeStep === 1) {
        await updateVendorProfile(currentProfile.id, vendorFormToBusinessPayload(form));
        const logoFile = formFile(form, "logoFile");
        if (logoFile) await replaceVendorLogo(currentProfile.id, logoFile);
      } else if (activeStep === 2) {
        await saveVendorRelatedData(vendorFormToRelatedData(form, currentProfile));
      }
      const profile = (await resource.reload()) ?? currentProfile;
      resource.setData(profile);
      return profile;
    },
    [resource.reload, resource.setData],
  );

  return { ...resource, reloadAndNotify, saveProfile, saveVerifiedProfile };
}
