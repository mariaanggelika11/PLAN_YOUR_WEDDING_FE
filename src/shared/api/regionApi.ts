import { withRequestDeadline } from "./requestDeadline";
export interface RegionOption {
  code: string;
  name: string;
}

interface RegionResponse {
  data: RegionOption[];
}

export function getProvinces() {
  return getRegions("/api/regions/provinces");
}

export function getCities(provinceCode: string) {
  return getRegions(`/api/regions/cities?provinceCode=${encodeURIComponent(provinceCode)}`);
}

async function getRegions(url: string) {
  return withRequestDeadline(async (signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error("Region data failed");
    return ((await response.json()) as RegionResponse).data;
  });
}
