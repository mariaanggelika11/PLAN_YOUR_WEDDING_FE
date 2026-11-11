import { createTranslator } from "next-intl";
import id from "./messages/validation.id.json" with { type: "json" };
import en from "./messages/validation.en.json" with { type: "json" };
import type { AppLocale } from "./locale.ts";
import type { TranslationVariables } from "./bridge.ts";

const translators = {
  id: createTranslator({ locale: "id", messages: id }),
  en: createTranslator({ locale: "en", messages: en }),
};
type ValidationKey =
  | `validation.${keyof typeof id.validation}`
  | `validationFields.${keyof typeof id.validationFields}`;
export function translateValidationKey(
  key: ValidationKey,
  locale: AppLocale,
  variables?: TranslationVariables,
) {
  return translators[locale](key, variables);
}
