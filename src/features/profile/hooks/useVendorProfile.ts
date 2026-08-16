"use client";

import { useProfileData } from "@/features/profile/context/ProfileProvider";

export function useVendorProfile() {
  const resource = useProfileData("vendor");

  return { ...resource, profile: resource.data };
}
