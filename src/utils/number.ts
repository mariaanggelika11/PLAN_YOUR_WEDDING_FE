export function parseFormattedInteger(value: string | number | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatThousands(value: string | number | null | undefined) {
  const digits = parseFormattedInteger(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function toOptionalInteger(value: string | number | null | undefined) {
  const digits = parseFormattedInteger(value);
  return digits ? Number(digits) : undefined;
}
