import { DEFAULT_LOCALE, resolveLocale } from "./locale.ts";

/** Read only at the point of presenting an API error; never use it for business rules. */
export function browserLocale() {
  return typeof document === "undefined"
    ? DEFAULT_LOCALE
    : resolveLocale(document.documentElement.lang);
}
