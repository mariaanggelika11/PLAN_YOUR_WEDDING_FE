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

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink to-slate-700 p-7 text-white shadow-2xl">
      <div className="absolute right-0 top-0 size-64 rounded-full bg-blush/30 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
            Wedding Anda semakin dekat
          </span>
          <h2 className="mt-4 text-3xl font-semibold">167 hari menuju hari istimewa</h2>
          <p className="mt-2 text-sm text-stone-300">
            {eventDate}
            {eventLocation ? ` · ${eventLocation}` : ""}
          </p>
        </div>
        <div className="grid size-32 place-items-center rounded-full border-[10px] border-white/20 border-t-rose-300 text-center">
          <span>
            <strong className="block text-2xl">68%</strong>
            <small className="text-stone-300">progress</small>
          </span>
        </div>
      </div>
    </section>
  );
}
