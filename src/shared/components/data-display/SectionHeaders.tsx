"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const { translateText } = useTranslation();
  return (
    <header className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="page-heading">{translateText(title)}</h1>
        <p className="page-description">{translateText(description)}</p>
      </div>
      {action}
    </header>
  );
}
export function SectionHeader({ title, description }: { title: string; description?: string }) {
  const { translateText } = useTranslation();
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{translateText(title)}</h2>
      {description && (
        <p className="mt-1 text-sm leading-6 text-stone-500">{translateText(description)}</p>
      )}
    </div>
  );
}
