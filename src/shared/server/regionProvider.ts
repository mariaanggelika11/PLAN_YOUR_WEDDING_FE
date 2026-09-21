interface Region {
  code: string;
  name: string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;
const FAILURE_TTL = 30_000;

// Cache parsed data, not response streams: a broken upstream body must stay
// inside the route's error boundary rather than Next's background cache writer.
export function createRegionProvider(fetcher: typeof fetch = fetch, now = Date.now) {
  const cache = new Map<string, { data: Region[]; expires: number }>();
  const pending = new Map<string, Promise<Region[]>>();
  const failures = new Map<string, number>();

  async function download(path: string): Promise<Region[]> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetcher(`https://wilayah.id/api/${path}.json`, {
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) throw new Error(`Region provider returned ${response.status}`);
        const payload: unknown = await response.json();
        if (
          !payload ||
          typeof payload !== "object" ||
          !("data" in payload) ||
          !Array.isArray(payload.data) ||
          !payload.data.length
        ) {
          throw new Error("Invalid region response");
        }
        return payload.data.map((item: unknown) => {
          if (
            !item ||
            typeof item !== "object" ||
            !("code" in item) ||
            !("name" in item) ||
            typeof item.code !== "string" ||
            typeof item.name !== "string" ||
            !item.name.trim()
          ) {
            throw new Error("Invalid region entry");
          }
          return { code: item.code, name: item.name.trim() };
        });
      } catch (error) {
        if (attempt === 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    throw new Error("Region provider unavailable");
  }

  return function getRegions(provinceCode?: string): Promise<Region[]> {
    if (provinceCode !== undefined && !/^\d{2}$/.test(provinceCode)) {
      return Promise.reject(new Error("Invalid province code"));
    }
    const path = provinceCode === undefined ? "provinces" : `regencies/${provinceCode}`;
    const cached = cache.get(path);
    if (cached && cached.expires > now()) return Promise.resolve(cached.data);
    if ((failures.get(path) ?? 0) > now()) {
      return cached
        ? Promise.resolve(cached.data)
        : Promise.reject(new Error("Region provider unavailable"));
    }
    const existing = pending.get(path);
    if (existing) return existing;
    const request = download(path)
      .then((data) => {
        cache.set(path, { data, expires: now() + CACHE_TTL });
        failures.delete(path);
        return data;
      })
      .catch((error: unknown) => {
        failures.set(path, now() + FAILURE_TTL);
        if (cached) return cached.data;
        throw error;
      })
      .finally(() => pending.delete(path));
    pending.set(path, request);
    return request;
  };
}

export const getRegions = createRegionProvider();
