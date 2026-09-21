"use client";

import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { useTranslation } from "@/shared/i18n/useTranslation";

export function DetailGrid({
  items,
  title,
}: {
  items: [string, React.ReactNode][];
  title?: string;
}) {
  const { translateText } = useTranslation();
  return (
    <div className="min-w-0 self-start rounded-xl border bg-white p-5 sm:p-6">
      {title && (
        <div className="mb-5 border-b pb-4">
          <SectionHeader title={title} />
        </div>
      )}
      <dl className="grid min-w-0 content-start items-start gap-x-6 gap-y-5 md:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-stone-500">{translateText(label)}</dt>
            <dd className="mt-2 break-words text-sm leading-6 text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
export function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-xl border bg-white p-6">
      <SectionHeader title={title} description={description} />
      <div className="mt-5 h-40 rounded-xl border border-dashed bg-stone-50" />
    </section>
  );
}
