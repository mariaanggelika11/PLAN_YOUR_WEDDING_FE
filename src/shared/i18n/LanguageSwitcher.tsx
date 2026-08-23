"use client";

import { AppButton } from "@/shared/components/ui/AppButton";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t, toggleLocale } = useTranslation();

  return (
    <AppButton
      aria-label={t("language.switchTo")}
      className={className}
      onClick={toggleLocale}
      title={t("language.switchTo")}
      type="button"
      variant="secondary"
    >
      <Languages size={17} />
      {locale === "id" ? "ID" : "EN"}
    </AppButton>
  );
}
