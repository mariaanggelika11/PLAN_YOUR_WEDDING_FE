/** Compatibility adapter while the API stores coverage as a single string. */
export function parseServiceAreas(value?: string | null): string[] {
  const seen = new Set<string>();
  return (value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLocaleLowerCase("id");
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function serializeServiceAreas(values: string[]): string {
  return parseServiceAreas(values.join(", ")).join(", ");
}

export function marketplaceLocations(values: string[]): string[] {
  return parseServiceAreas(values.join(", ")).sort((a, b) => a.localeCompare(b, "id"));
}
