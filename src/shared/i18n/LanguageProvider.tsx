"use client";

import { enDictionary, enTextDictionary } from "@/shared/i18n/dictionaries/en";
import { idDictionary, type TranslationKey } from "@/shared/i18n/dictionaries/id";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppLocale = "id" | "en";
type TranslationVariables = Record<string, string | number>;

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey, variables?: TranslationVariables) => string;
  translateText: (text: string) => string;
  toggleLocale: () => void;
}

const STORAGE_KEY = "pyw-locale";
const dictionaries = { id: idDictionary, en: enDictionary };

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("id");

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    } catch {
      // Bahasa tetap berubah walaupun penyimpanan browser tidak tersedia.
    }
  }, []);

  useEffect(() => {
    try {
      const savedLocale = window.localStorage.getItem(STORAGE_KEY);
      if (savedLocale === "id" || savedLocale === "en") setLocaleState(savedLocale);
    } catch {
      // Gunakan bahasa Indonesia sebagai fallback.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, variables: TranslationVariables = {}) =>
      interpolate(dictionaries[locale][key] ?? idDictionary[key], variables),
    [locale],
  );
  const toggleLocale = useCallback(
    () => setLocale(locale === "id" ? "en" : "id"),
    [locale, setLocale],
  );
  const translateText = useCallback(
    (text: string) => (locale === "en" ? (enTextDictionary[text] ?? text) : text),
    [locale],
  );
  const value = useMemo(
    () => ({ locale, setLocale, t, toggleLocale, translateText }),
    [locale, setLocale, t, toggleLocale, translateText],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function interpolate(template: string, variables: TranslationVariables) {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in variables ? String(variables[key]) : placeholder,
  );
}
