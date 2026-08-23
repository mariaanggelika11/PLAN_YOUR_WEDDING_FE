"use client";

import { usePageHeaderSetter } from "@/shared/components/layout/PageHeaderContext";
import { useEffect, type ReactNode } from "react";

interface FeaturePageProps {
  title: string;
  description: string;
  children: ReactNode;
  showHeader?: boolean;
}

export function FeaturePage({ title, description, children, showHeader = true }: FeaturePageProps) {
  const setPageHeader = usePageHeaderSetter();
  useEffect(() => {
    if (!showHeader || !setPageHeader) return;
    setPageHeader({ description, title });
    return () => setPageHeader(null);
  }, [description, setPageHeader, showHeader, title]);
  return <div className="grid gap-5">{children}</div>;
}
