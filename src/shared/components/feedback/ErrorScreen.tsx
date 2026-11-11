"use client";

import { useEffect, useState } from "react";
import { resolveLocale, type AppLocale, LOCALE_PREFERENCE_KEY } from "@/shared/i18n/locale";
import { translateErrorMessage } from "@/shared/i18n/errorMessages";

/** Also works outside the root providers when the root layout itself fails. */
export function ErrorScreen({ reset, digest }: { reset: () => void; digest?: string }) {
  const [locale, setLocale] = useState<AppLocale>("id");
  useEffect(() => {
    const cookie = document.cookie
      .split(";")
      .find((entry) => entry.trim().startsWith(`${LOCALE_PREFERENCE_KEY}=`));
    const current = resolveLocale(cookie?.split("=")[1]);
    setLocale(current);
    document.documentElement.lang = current;
  }, []);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-screen place-items-center bg-stone-50 px-5 py-12"
    >
      <section
        role="alert"
        className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-stone-900">
          {translateErrorMessage("errors.title", locale)}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {translateErrorMessage("errors.description", locale)}
        </p>
        {digest && (
          <p className="mt-3 text-xs text-stone-600">
            {translateErrorMessage("errors.reference", locale)} {digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-rose-700 px-5 py-3 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          >
            {translateErrorMessage("errors.retry", locale)}
          </button>
          {/* A full navigation also recovers when the root provider/router failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="rounded-lg border px-5 py-3 font-medium text-stone-700">
            {translateErrorMessage("errors.home", locale)}
          </a>
        </div>
      </section>
    </main>
  );
}
