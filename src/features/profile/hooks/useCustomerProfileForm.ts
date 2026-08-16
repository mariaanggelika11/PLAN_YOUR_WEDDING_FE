"use client";

import { useCallback } from "react";
import { useProfileData } from "@/components/providers/ProfileProvider";
import { customerFormToPayload } from "@/features/profile/mappers/profileMappers";
import { saveCustomerProfileDraft } from "@/services/profileService";
import type { MasterParameterOption } from "@/hooks/useMasterParameters";

export function useCustomerProfileForm(enabled = true) {
  const resource = useProfileData("customer", enabled);

  const reloadAndNotify = useCallback(async () => {
    return resource.reload();
  }, [resource.reload]);

  const saveProfile = useCallback(
    async (form: HTMLFormElement, eventTypeOptions: MasterParameterOption[]) => {
      const profile = await saveCustomerProfileDraft(customerFormToPayload(form, eventTypeOptions));
      resource.setData(profile);
      return profile;
    },
    [resource.setData],
  );

  return { ...resource, reloadAndNotify, saveProfile };
}
