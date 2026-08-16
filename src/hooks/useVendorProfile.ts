"use client";

import { useProfileData } from "@/components/providers/ProfileProvider";

export function useVendorProfile() {
  const resource = useProfileData("vendor");

  return { ...resource, profile: resource.data };
}
