export interface ParameterOption {
  label: string;
  value: string;
}

export function eventTypeApiValue(selectedValue: string, options: ParameterOption[]) {
  const option = options.find((item) => item.value === selectedValue);
  const normalized = normalizeEnumValue(option?.label ?? selectedValue);
  if (normalized === "AKAD") return "AKAD";
  if (normalized === "RESEPSI") return "RESEPSI";
  if (normalized === "AKAD_DAN_RESEPSI") return "AKAD_DAN_RESEPSI";
  return "LAINNYA";
}

export function serializeCategoryValues(values: string[]) {
  return JSON.stringify(
    values.map((value) => value.trim()).filter((value) => value && !/^\d+$/.test(value)),
  );
}

export function parameterOptionLabels(values: string[], options: ParameterOption[]) {
  return [
    ...new Set(
      values.flatMap((savedValue) => {
        const normalizedSavedValue = normalizeParameterText(savedValue);
        const option = options.find(
          (item) =>
            normalizeParameterText(item.value) === normalizedSavedValue ||
            normalizeParameterText(item.label) === normalizedSavedValue,
        );
        if (option) return [option.label.trim()];
        const trimmedValue = savedValue.trim();
        return trimmedValue && !/^\d+$/.test(trimmedValue) ? [trimmedValue] : [];
      }),
    ),
  ];
}

export function vendorProfileStatus(status?: number | null) {
  return (
    (
      {
        1: "DRAFT",
        2: "PENDING_VERIFICATION",
        3: "VERIFIED",
        4: "REJECTED",
        5: "SUSPENDED",
        6: "INACTIVE",
      } as const
    )[status as 1] ?? "INACTIVE"
  );
}

export function canVendorSell(
  profile: { active?: boolean; isVerified?: boolean; status?: number | null } | null,
) {
  return Boolean(
    profile?.isVerified && profile.active !== false && ![5, 6].includes(profile.status ?? 0),
  );
}

export function vendorDisplayStatus(
  profile: { active?: boolean; isVerified?: boolean; status?: number | null } | null,
) {
  if (canVendorSell(profile)) return "VERIFIED_ACTIVE";
  if (profile?.active === false) return "INACTIVE";
  return vendorProfileStatus(profile?.status);
}

function normalizeEnumValue(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function normalizeParameterText(value: string) {
  return value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").toUpperCase();
}
