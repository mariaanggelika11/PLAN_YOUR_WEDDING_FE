"use client";

import { usePageHeaderSetter } from "@/shared/components/layout/PageHeaderContext";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { useEffect, type ReactNode } from "react";

interface FeaturePageProps {
  title: string;
  description: string;
  children: ReactNode;
  showHeader?: boolean;
}

export function FeaturePage({ title, description, children, showHeader = true }: FeaturePageProps) {
  const { translateText } = useTranslation();
  const setPageHeader = usePageHeaderSetter();
  const translatedTitle = translateText(title);
  const translatedDescription = translateText(description);
  useEffect(() => {
    if (!showHeader || !setPageHeader) return;
    setPageHeader({ description: translatedDescription, title: translatedTitle });
    return () => setPageHeader(null);
  }, [setPageHeader, showHeader, translatedDescription, translatedTitle]);
  return (
    <div className="page-stack">
      {!showHeader && (
        <header>
          <h1 className="page-heading break-words">{translatedTitle}</h1>
          <p className="page-description">{translatedDescription}</p>
        </header>
      )}
      {children}
    </div>
  );
}
