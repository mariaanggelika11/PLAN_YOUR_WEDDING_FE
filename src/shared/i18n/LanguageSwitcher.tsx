"use client";

import { AppButton } from "@/shared/components/ui/AppButton";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t, toggleLocale, isSwitchingLocale, languageError } = useTranslation();

  return (
    <span className="relative inline-flex">
      <AppButton
        aria-busy={isSwitchingLocale}
        disabled={isSwitchingLocale}
        aria-label={`${locale.toUpperCase()} — ${t("language.switchTo")}`}
        className={className}
        onClick={toggleLocale}
        title={t("language.switchTo")}
        type="button"
        variant="secondary"
      >
        <Languages size={17} />
        {locale === "id" ? "ID" : "EN"}
      </AppButton>
      {languageError && (
        <span
          role="alert"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-red-200 bg-white p-3 text-xs text-red-700 shadow-lg"
        >
          {t("language.loadError")}
        </span>
      )}
    </span>
  );
}
