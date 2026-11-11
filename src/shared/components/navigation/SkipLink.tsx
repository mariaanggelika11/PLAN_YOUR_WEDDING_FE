"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";
export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a className="skip-link" href="#main-content">
      {t("accessibility.skipToContent")}
    </a>
  );
}
