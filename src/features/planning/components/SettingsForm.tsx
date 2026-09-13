"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import type { PlanSettings } from "../model";
import { displayDate } from "../format";
import { usePlanningMutation } from "../usePlanningMutation";
import { usePlanningModalBusy } from "./PlanningModal";

export function SettingsForm({
  initial,
  existing,
  autoReschedule,
  onSave,
}: {
  initial: PlanSettings;
  existing: boolean;
  autoReschedule: boolean;
  onSave: (settings: PlanSettings, shift: boolean) => Promise<void>;
}) {
  const [settings, setSettings] = useState(initial);
  const [isInitialCreation] = useState(!existing);
  const [shift, setShift] = useState(autoReschedule);
  const mutation = usePlanningMutation();
  usePlanningModalBusy(mutation.busy);
  function submit(e: FormEvent) {
    e.preventDefault();
    void mutation.run(() => onSave(settings, shift));
  }
  if (mutation.busy) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 py-10 text-center"
      >
        <LoaderCircle
          aria-hidden="true"
          className="size-10 animate-spin text-blush motion-reduce:animate-none"
        />
        <div>
          <p className="font-semibold text-ink">
            {isInitialCreation
              ? "Sedang membuat checklist pernikahanmu…"
              : "Sedang menyimpan pengaturan…"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
            Kami sedang menyiapkan tugas dan tenggatnya. Proses ini bisa memerlukan beberapa saat.
            Tunggu sampai selesai dan jangan tutup halaman ini dulu, ya.
          </p>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-5">
      {mutation.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {mutation.error}
        </p>
      )}
      <div className="rounded-2xl border p-4 text-sm">
        <p>Tanggal acara: {displayDate(initial.date)}</p>
        <p className="mt-2 text-stone-500">
          Tanggal, lokasi, jumlah tamu, dan anggaran mengikuti profil pernikahanmu.
        </p>
        <Link
          aria-disabled={mutation.busy}
          onClick={(event) => {
            if (mutation.busy) event.preventDefault();
          }}
          className="mt-3 inline-block text-blush underline"
          href={ROUTES.customer.profile}
        >
          Ubah detail acara di profil
        </Link>
      </div>
      <fieldset disabled={mutation.busy} className="grid gap-3 rounded-2xl bg-stone-50 p-4">
        <legend className="text-sm font-semibold">Kebutuhan tambahan</legend>
        {(
          [
            ["traditional", "Ada rangkaian acara adat"],
            ["outdoor", "Acara di luar ruangan"],
            ["useWo", "Menggunakan wedding organizer"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <input
              className="size-4 accent-blush"
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-blush"
            disabled={mutation.busy}
            checked={shift}
            onChange={(e) => setShift(e.target.checked)}
          />
          Sesuaikan tenggat otomatis saat tanggal acara berubah. Tenggat yang diedit sendiri dan
          tugas selesai tetap dipertahankan.
        </label>
        <p className="text-xs leading-5 text-stone-500">
          Kebutuhan tambahan akan menambahkan tugas yang belum ada. Tugas lama tetap disimpan; pilih
          “Tidak diperlukan” pada tugas yang tidak lagi relevan.
        </p>
      </>
      <AppButton type="submit" disabled={mutation.busy}>
        {mutation.busy ? "Menyimpan…" : existing ? "Simpan pengaturan" : "Buat checklist"}
      </AppButton>
    </form>
  );
}
