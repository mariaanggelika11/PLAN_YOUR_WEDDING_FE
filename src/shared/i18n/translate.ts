import { createTranslator } from "next-intl";
import { messages, type TranslationKey } from "./catalog.ts";
import type { AppLocale } from "./locale.ts";

export type { AppLocale } from "./locale.ts";
export { translateWith } from "./bridge.ts";
export type { TranslationVariables } from "./bridge.ts";
import { translateWith, type TranslationVariables } from "./bridge.ts";

const translators = {
  id: createTranslator({ locale: "id", messages: messages.id }),
  en: createTranslator({ locale: "en", messages: messages.en }),
};

/** Non-React consumers, including order timelines and PDF exports, use the same ICU engine. */
export function translateInterfaceText(
  text: string,
  locale: AppLocale,
  variables?: TranslationVariables,
) {
  return translateWith(translators[locale], text, variables);
}

/** Stable-key messages for surfaces outside React providers, including global errors. */
export function translateMessage(
  key: TranslationKey,
  locale: AppLocale,
  variables?: TranslationVariables,
) {
  return translators[locale](key, variables);
}
