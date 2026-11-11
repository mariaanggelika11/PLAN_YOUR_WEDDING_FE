import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { id, enErrors, enStatuses } from "./messages";
import { experienceId } from "./experience";
import { formHintsId } from "./formGuidance";
export const languageReady = i18n.use(initReactI18next).init({
  lng: "id",
  fallbackLng: "en",
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  resources: {
    id: { translation: { ...id, ...experienceId, ...formHintsId } },
    en: {
      translation: {
        ...Object.fromEntries(
          Object.keys({ ...id, ...experienceId, ...formHintsId }).map((key) => [key, key]),
        ),
        ...enErrors,
        ...enStatuses,
      },
    },
  },
});
export async function restoreLanguage() {
  await languageReady;
  try {
    const saved = await AsyncStorage.getItem("pyw.native.language");
    if (saved === "id" || saved === "en") await i18n.changeLanguage(saved);
  } catch {
    /* Retain Indonesian if preference storage fails. */
  }
}
export function useI18n() {
  const { t } = useTranslation();
  const locale = i18n.language === "en" ? "en" : "id";
  return {
    t,
    locale,
    toggleLanguage: async () => {
      const next = locale === "id" ? "en" : "id";
      await i18n.changeLanguage(next);
      try {
        await AsyncStorage.setItem("pyw.native.language", next);
      } catch {
        /* The current language remains usable. */
      }
    },
  } as const;
}
export function errorKey(error: unknown) {
  const key = error instanceof Error ? error.message : "REQUEST_FAILED";
  return Object.hasOwn(enErrors, key) ? key : "REQUEST_FAILED";
}
export function money(amount: number, locale: "id" | "en") {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}
export function dateLabel(value: string | undefined | null, locale: "id" | "en") {
  if (!value) return "—";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
}
