"use client";

import { AppButton } from "@/shared/components/ui/AppButton";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { AlertCircle, Inbox, SearchX } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  type = "default",
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: "default" | "search";
}) {
  const { t } = useTranslation();
  const Icon = type === "search" ? SearchX : Inbox;
  // TODO API: Tampilkan empty state jika response API kosong
  return (
    <div className="grid place-items-center rounded-xl border border-dashed bg-white px-5 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-xl bg-rose-50 text-blush">
        <Icon />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title ?? t("empty.title")}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
        {description ?? t("empty.description")}
      </p>
      {actionLabel && (
        <AppButton className="mt-5" onClick={onAction}>
          {actionLabel}
        </AppButton>
      )}
    </div>
  );
}
export function ErrorState({ retry, description }: { retry?: () => void; description?: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <AlertCircle className="mb-2 text-red-600" />
      <h3 className="font-semibold text-red-800">{t("error.loadTitle")}</h3>
      <p className="mt-1 text-sm text-red-700">{description ?? t("error.loadDescription")}</p>
      {retry && (
        <AppButton className="mt-4" variant="secondary" onClick={retry}>
          {t("error.retry")}
        </AppButton>
      )}
    </div>
  );
}
export function LoadingSkeleton() {
  /* TODO API: Tampilkan skeleton saat request API berjalan */ return (
    <div role="status" aria-label="Memuat data" className="grid animate-pulse gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="overflow-hidden rounded-xl border bg-white p-4">
          <div className="h-32 rounded-xl bg-stone-200" />
          <div className="mt-4 h-4 w-2/3 rounded bg-stone-200" />
          <div className="mt-3 h-3 rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}
export function SuccessState({ message }: { message: string }) {
  return (
    <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</p>
  );
}
