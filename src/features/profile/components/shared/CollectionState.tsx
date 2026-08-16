import type { ReactNode } from "react";

export function SectionHeading({
  action,
  description,
  title,
}: {
  action: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function EmptyCollection({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-stone-50 px-5 py-8 text-center text-sm text-stone-500">
      {message}
    </div>
  );
}
