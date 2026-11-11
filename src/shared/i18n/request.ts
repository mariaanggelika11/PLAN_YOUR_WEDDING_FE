import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { messages } from "./catalog";
import { LOCALE_PREFERENCE_KEY, resolveLocale } from "./locale";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_PREFERENCE_KEY)?.value);
  return { locale, messages: messages[locale], timeZone: "Asia/Jakarta" };
});
