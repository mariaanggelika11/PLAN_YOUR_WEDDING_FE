"use client";

import { LanguageContext } from "@/shared/i18n/LanguageProvider";
import { useContext } from "react";

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation harus digunakan di dalam LanguageProvider.");
  return context;
}
