"use client";

import { useProfileData } from "@/features/profile/context/ProfileProvider";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { formatDate } from "@/shared/utils/formatDate";

export function CustomerDashboardProfile() {
  const customer = useProfileData("customer");
  if (customer.loading) return <LoadingSkeleton />;
  if (customer.error) return <ErrorState retry={() => void customer.reload()} />;

  const profile = customer.data;
  const eventDate = profile?.weddingDate
    ? formatDate(profile.weddingDate)
    : "Tanggal acara belum ditentukan";
  const eventLocation = profile?.weddingLocation?.trim() || profile?.weddingCity?.trim();

  const weddingDay = profile?.weddingDate
    ? new Date(`${profile.weddingDate.slice(0, 10)}T00:00:00`)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = weddingDay ? Math.ceil((weddingDay.getTime() - today.getTime()) / 86400000) : null;
  const countdown =
    days == null || !Number.isFinite(days)
      ? "Atur tanggal hari istimewa Anda"
      : days > 0
        ? `${days} hari menuju hari istimewa`
        : days === 0
          ? "Hari istimewa Anda tiba"
          : "Momen istimewa Anda telah berlangsung";
  return (
    <section className="relative overflow-hidden rounded-xl border bg-cream p-5 text-ink sm:p-8">
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs backdrop-blur">
            Wedding Anda semakin dekat
          </span>
          <h2 className="mt-4 max-w-lg text-2xl sm:text-3xl font-semibold">{countdown}</h2>
          <p className="mt-2 text-sm text-stone-600">
            {eventDate}
            {eventLocation ? ` · ${eventLocation}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
