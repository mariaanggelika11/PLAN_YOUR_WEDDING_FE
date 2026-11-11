"use client";

import type { MasterParameterOption } from "@/features/parameters/useMasterParameters";
import { saveCustomerProfileDraft, updateCustomerProfile } from "@/features/profile/api/profileApi";
import { useProfileData } from "@/features/profile/context/ProfileProvider";
import { customerFormToPayload } from "@/features/profile/mappers";
import { useCallback } from "react";

export function useCustomerProfileEditor(enabled = true) {
  const resource = useProfileData("customer", enabled);
  const { data, reload, setData } = resource;

  const reloadAndNotify = useCallback(async () => {
    return reload();
  }, [reload]);

  const saveProfile = useCallback(
    async (form: HTMLFormElement, eventTypeOptions: MasterParameterOption[]) => {
      const payload = customerFormToPayload(form, eventTypeOptions);
      const saved = data
        ? await updateCustomerProfile(data.id, payload)
        : await saveCustomerProfileDraft(payload);
      setData(saved);
      const refreshed = await reload();
      return refreshed ?? saved;
    },
    [data, reload, setData],
  );

  return { ...resource, reloadAndNotify, saveProfile };
}
