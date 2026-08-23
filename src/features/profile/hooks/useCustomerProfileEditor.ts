"use client";

import type { MasterParameterOption } from "@/features/parameters/useMasterParameters";
import { saveCustomerProfileDraft, updateCustomerProfile } from "@/features/profile/api/profileApi";
import { useProfileData } from "@/features/profile/context/ProfileProvider";
import { customerFormToPayload } from "@/features/profile/mappers";
import { useCallback } from "react";

export function useCustomerProfileEditor(enabled = true) {
  const resource = useProfileData("customer", enabled);

  const reloadAndNotify = useCallback(async () => {
    return resource.reload();
  }, [resource.reload]);

  const saveProfile = useCallback(
    async (form: HTMLFormElement, eventTypeOptions: MasterParameterOption[]) => {
      const payload = customerFormToPayload(form, eventTypeOptions);
      const saved = resource.data
        ? await updateCustomerProfile(resource.data.id, payload)
        : await saveCustomerProfileDraft(payload);
      resource.setData(saved);
      const refreshed = await resource.reload();
      return refreshed ?? saved;
    },
    [resource.data, resource.reload, resource.setData],
  );

  return { ...resource, reloadAndNotify, saveProfile };
}
