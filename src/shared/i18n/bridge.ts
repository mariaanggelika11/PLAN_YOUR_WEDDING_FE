import { textKeys } from "./textKeys.ts";
import type { TranslationKey } from "./catalog.ts";

export type TranslationVariables = Record<string, string | number>;

type TextTranslator = (key: TranslationKey, variables: TranslationVariables) => string;

/** Preserve literal placeholders when a legacy call omits a variable. */
function messageValues(text: string, variables: TranslationVariables = {}) {
  const values: TranslationVariables = {};
  for (const match of text.matchAll(/\{(\w+)\}/g)) {
    values[match[1]] = Object.hasOwn(variables, match[1]) ? variables[match[1]] : match[0];
  }
  return values;
}

/** Bridge existing interface copy to stable next-intl keys without translating user content. */
export function translateWith(
  translator: TextTranslator,
  text: string,
  variables?: TranslationVariables,
) {
  if (!Object.hasOwn(textKeys, text)) return text;
  return translator(textKeys[text], messageValues(text, variables));
}
