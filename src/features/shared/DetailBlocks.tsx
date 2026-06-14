import { SectionHeader } from "@/components/common/Headers";

export function DetailGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
          <dd className="mt-1 text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-2xl border bg-white p-6">
      <SectionHeader title={title} description={description} />
      <div className="mt-5 h-40 rounded-xl border border-dashed bg-stone-50" />
    </section>
  );
}
