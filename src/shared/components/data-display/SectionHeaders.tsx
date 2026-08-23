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
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {translateText(title)}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-stone-500">{translateText(description)}</p>
      </div>
      {action}
    </header>
  );
}
export function SectionHeader({ title, description }: { title: string; description?: string }) {
  const { translateText } = useTranslation();
  return (
    <div>
      <h2 className="text-xl font-semibold">{translateText(title)}</h2>
      {description && <p className="mt-1 text-sm text-stone-500">{translateText(description)}</p>}
    </div>
  );
}
