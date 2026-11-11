import { createTranslator } from "next-intl";
import id from "./messages/errors.id.json" with { type: "json" };
import en from "./messages/errors.en.json" with { type: "json" };
import type { AppLocale } from "./locale.ts";
const translators = {
  id: createTranslator({ locale: "id", messages: id }),
  en: createTranslator({ locale: "en", messages: en }),
};
export function translateErrorMessage(key: `errors.${keyof typeof id.errors}`, locale: AppLocale) {
  return translators[locale](key);
}
