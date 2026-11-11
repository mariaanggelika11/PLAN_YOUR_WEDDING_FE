"use client";

import { NextIntlClientProvider } from "next-intl";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppMessages } from "./catalog";
import { loadLocaleMessages } from "./loadMessages";
import { isAppLocale, LOCALE_PREFERENCE_KEY, type AppLocale } from "./locale";
export type { AppLocale } from "./locale";

interface LanguageActions {
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
  isSwitchingLocale: boolean;
  languageError: boolean;
}
export const LanguageActionsContext = createContext<LanguageActions | null>(null);

function persistLocale(locale: AppLocale) {
  document.cookie = `${LOCALE_PREFERENCE_KEY}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  try {
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, locale);
  } catch {
    /* Cookie and current locale remain available. */
  }
}

export function LanguageProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode;
  initialLocale: AppLocale;
  initialMessages: AppMessages;
}) {
  const [active, setActive] = useState({ locale: initialLocale, messages: initialMessages });
  const [isSwitchingLocale, setSwitching] = useState(false);
  const [languageError, setLanguageError] = useState(false);
  const cache = useRef(new Map<AppLocale, AppMessages>([[initialLocale, initialMessages]]));
  const changeId = useRef(0);

  const setLocale = useCallback(async (locale: AppLocale) => {
    if (!isAppLocale(locale)) return;
    const requestId = ++changeId.current;
    setSwitching(true);
    setLanguageError(false);
    try {
      const messages = cache.current.get(locale) ?? (await loadLocaleMessages(locale));
      cache.current.set(locale, messages);
      if (requestId !== changeId.current) return;
      setActive({ locale, messages });
      persistLocale(locale);
    } catch {
      if (requestId === changeId.current) setLanguageError(true);
    } finally {
      if (requestId === changeId.current) setSwitching(false);
    }
  }, []);

  useEffect(() => {
    const hasCookie = document.cookie
      .split(";")
      .some((entry) => entry.trim().startsWith(`${LOCALE_PREFERENCE_KEY}=`));
    if (hasCookie) return;
    try {
      const saved = window.localStorage.getItem(LOCALE_PREFERENCE_KEY);
      if (isAppLocale(saved)) void setLocale(saved);
    } catch {
      /* Keep the language rendered by the server. */
    }
  }, [setLocale]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === LOCALE_PREFERENCE_KEY && isAppLocale(event.newValue))
        void setLocale(event.newValue);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [setLocale]);
  useEffect(() => {
    document.documentElement.lang = active.locale;
  }, [active.locale]);

  const toggleLocale = useCallback(() => {
    void setLocale(active.locale === "id" ? "en" : "id");
  }, [active.locale, setLocale]);
  const actions = useMemo(
    () => ({ setLocale, toggleLocale, isSwitchingLocale, languageError }),
    [setLocale, toggleLocale, isSwitchingLocale, languageError],
  );
  return (
    <LanguageActionsContext.Provider value={actions}>
      <NextIntlClientProvider
        locale={active.locale}
        messages={active.messages}
        timeZone="Asia/Jakarta"
      >
        {children}
      </NextIntlClientProvider>
    </LanguageActionsContext.Provider>
  );
}
