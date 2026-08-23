"use client";

import { deleteVendorLogo, replaceVendorLogo } from "@/features/profile/api/attachmentApi";
import {
  saveVendorProfileDraft,
  saveVendorRelatedData,
  submitVendorProfile,
  updateVendorProfile,
} from "@/features/profile/api/profileApi";
import { useProfileData } from "@/features/profile/context/ProfileProvider";
import {
  formFile,
  formValue,
  vendorFormToPayload,
  vendorFormToRelatedData,
  vendorFormToUpdatePayload,
} from "@/features/profile/mappers";
import type { VendorApiProfile } from "@/features/profile/types";
import { useCallback } from "react";

export function useVendorProfileEditor(enabled = true) {
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
        } catch {
          logoUploadFailed = true;
        }
      } else if (formValue(form, "removeVendorLogo") === "true") {
        try {
          await deleteVendorLogo(saved.id);
        } catch {
          logoUploadFailed = true;
        }
      }
      profile = (await resource.reload()) ?? profile;
      resource.setData(profile);
      return {
        logoUploadFailed,
        profile,
        uploadedDocument: Boolean(related.verificationDocument),
      };
    },
    [resource.reload, resource.setData],
  );

  const saveVerifiedProfile = useCallback(
    async (activeStep: number, form: HTMLFormElement, currentProfile: VendorApiProfile) => {
      if ([1, 2].includes(activeStep)) {
        if (activeStep === 1) {
          await updateVendorProfile(currentProfile.id, vendorFormToUpdatePayload(form));
        } else {
          await saveVendorRelatedData(vendorFormToRelatedData(form, currentProfile));
        }
      }
      if (activeStep === 1) {
        const logoFile = formFile(form, "logoFile");
        if (logoFile) await replaceVendorLogo(currentProfile.id, logoFile);
        else if (formValue(form, "removeVendorLogo") === "true") {
          await deleteVendorLogo(currentProfile.id);
        }
      }
      const profile = (await resource.reload()) ?? currentProfile;
      resource.setData(profile);
      return profile;
    },
    [resource.reload, resource.setData],
  );

  return { ...resource, reloadAndNotify, saveProfile, saveVerifiedProfile };
}
