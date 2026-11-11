"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useContext } from "react";
import { LanguageActionsContext } from "./LanguageProvider";
import { resolveLocale } from "./locale";
import { translateWith, type TranslationVariables } from "./bridge";
import type { TranslationKey } from "./catalog";

/** Compatibility hook keeps existing components and form behavior unchanged. */
export function useTranslation() {
  const actions = useContext(LanguageActionsContext);
  const locale = resolveLocale(useLocale());
  const translations = useTranslations();
  const t = useCallback(
    (key: TranslationKey, variables?: TranslationVariables) => translations(key, variables),
    [translations],
  );
  const translateText = useCallback(
    (text: string, variables?: TranslationVariables) =>
      translateWith(translations, text, variables),
    [translations],
  );
  if (!actions) throw new Error("useTranslation harus digunakan di dalam LanguageProvider.");
  return { ...actions, locale, t, translateText };
}
