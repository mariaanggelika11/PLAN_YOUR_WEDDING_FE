export type AppLocale = "id" | "en";

// Keep the existing preference name so the migration preserves saved languages.
export const LOCALE_PREFERENCE_KEY = "pyw-locale";
export const DEFAULT_LOCALE: AppLocale = "id";

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "id" || value === "en";
}

export function resolveLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE;
}
