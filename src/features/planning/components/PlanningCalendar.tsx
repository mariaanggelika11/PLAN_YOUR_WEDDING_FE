"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calendarDays, moveMonth, tasksByDate, calendarStatusCounts } from "../calendar";
import { type WeddingTask } from "../model";
import { displayDate } from "../format";
import { PlanningTaskRow } from "./PlanningTaskRow";
import { AppButton } from "@/shared/components/ui/AppButton";
import { cn } from "@/shared/utils/cn";

export function PlanningCalendar({
  tasks,
  today,
  busy,
  onOpen,
  onUpdate,
  onAdd,
}: {
  tasks: WeddingTask[];
  today: string;
  busy: boolean;
  onOpen: (id: string) => void;
  onUpdate: (task: WeddingTask) => Promise<void>;
  onAdd: (date: string) => void;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);
  const year = month.slice(0, 4);
  const months = Array.from({ length: 12 }, (_, index) => {
    const value = `${year}-${String(index + 1).padStart(2, "0")}`;
    const date = new Date(`${value}-01T00:00:00Z`);
    const entries = tasks.filter((task) => task.due.startsWith(`${value}-`));
    return {
      value,
      label: new Intl.DateTimeFormat("id-ID", { month: "long", timeZone: "UTC" }).format(date),
      shortLabel: new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(
        date,
      ),
      count: entries.length,
      counts: calendarStatusCounts(entries, today),
    };
  });
  const grouped = tasksByDate(tasks);
  const undated = tasks.filter((task) => !task.due);
  const selectedTasks = grouped.get(selectedDate) ?? [];
  const title = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
  function navigate(offset: number) {
    const next = moveMonth(month, offset);
    setMonth(next);
    setSelectedDate(`${next}-01`);
  }
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-semibold capitalize text-ink" aria-live="polite">
          {year}
        </h3>
        <div className="flex items-center gap-1">
          <AppButton
            variant="ghost"
            onClick={() => {
              setMonth(today.slice(0, 7));
              setSelectedDate(today);
            }}
          >
            Hari ini
          </AppButton>
          <button
            className="rounded-lg p-3 hover:bg-rose-50"
            aria-label="Tahun sebelumnya"
            onClick={() => navigate(-12)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="rounded-lg p-3 hover:bg-rose-50"
            aria-label="Tahun berikutnya"
            onClick={() => navigate(12)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        className="grid grid-cols-4 gap-2 px-4 pb-4 sm:grid-cols-6 sm:px-6"
        role="group"
        aria-label={`Semua bulan tahun ${year}`}
      >
        {months.map((item) => (
          <button
            key={item.value}
            aria-label={`${item.label} ${year}, ${item.count} tugas`}
            aria-pressed={month === item.value}
            onClick={() => {
              setMonth(item.value);
              setSelectedDate(`${item.value}-01`);
            }}
            className={cn(
              "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-xs transition-colors hover:border-rose-200 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blush",
              month === item.value
                ? "border-rose-300 bg-rose-50 font-semibold text-rose-900"
                : "border-stone-100 bg-white text-stone-600",
            )}
          >
            <span className="capitalize sm:hidden">{item.shortLabel}</span>
            <span className="hidden capitalize sm:inline">{item.label}</span>
            <span className="text-[10px] font-normal text-stone-500">{item.count} tugas</span>
            {item.count > 0 && (
              <span className="flex gap-1" aria-hidden="true">
                {item.counts.overdue > 0 && <span className="size-1.5 rounded-full bg-red-500" />}
                {item.counts.pending > 0 && <span className="size-1.5 rounded-full bg-pink-400" />}
                {item.counts.completed > 0 && (
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                )}
                {item.counts.skipped > 0 && <span className="size-1.5 rounded-full bg-stone-400" />}
              </span>
            )}
          </button>
        ))}
      </div>
      <h3
        className="border-t border-stone-100 px-4 py-4 text-sm font-semibold capitalize text-ink sm:px-6"
        aria-live="polite"
      >
        {title}
      </h3>
      <div className="px-2 sm:px-5">
        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-stone-500">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
            <div className="py-2" key={day}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-stone-100">
          {calendarDays(month).map((date) => {
            const entries = grouped.get(date) ?? [];
            const counts = calendarStatusCounts(entries, today);
            const statusText = `${counts.overdue} terlambat, ${counts.pending} belum selesai, ${counts.completed} selesai, ${counts.skipped} tidak diperlukan`;
            return (
              <button
                key={date}
                aria-label={`${displayDate(date)}, ${entries.length} tugas, ${statusText}`}
                aria-pressed={date === selectedDate}
                aria-current={date === today ? "date" : undefined}
                onClick={() => {
                  setSelectedDate(date);
                  if (!date.startsWith(month)) setMonth(date.slice(0, 7));
                }}
                className={cn(
                  "flex min-h-16 min-w-0 flex-col items-center gap-1 border-b border-r border-stone-100 p-1.5 text-xs transition-colors hover:bg-rose-50 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blush sm:min-h-20 sm:items-start sm:p-2",
                  !date.startsWith(month) && "bg-stone-50 text-stone-400",
                  date === selectedDate && "bg-rose-50 ring-1 ring-inset ring-rose-300",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full",
                    date === today && "font-semibold text-ink ring-2 ring-stone-600 ring-offset-1",
                  )}
                >
                  {Number(date.slice(-2))}
                </span>
                {entries.length > 0 && (
                  <>
                    <span className="text-[10px] text-stone-600 sm:text-xs">
                      {entries.length}
                      <span className="hidden sm:inline"> tugas</span>
                    </span>
                    <span className="flex flex-wrap justify-center gap-1" aria-hidden="true">
                      {counts.overdue > 0 && <span className="size-1.5 rounded-full bg-red-500" />}
                      {counts.pending > 0 && <span className="size-1.5 rounded-full bg-pink-400" />}
                      {counts.completed > 0 && (
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                      )}
                      {counts.skipped > 0 && (
                        <span className="size-1.5 rounded-full bg-stone-400" />
                      )}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className="flex flex-wrap gap-x-4 gap-y-2 px-4 pt-4 text-[11px] text-stone-500 sm:px-6"
        aria-label="Keterangan warna kalender"
      >
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" />
          Terlambat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-pink-400" />
          Belum selesai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          Sudah selesai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-stone-400" />
          Tidak diperlukan
        </span>
      </div>
      <section className="mt-5 border-t" aria-label={`Tugas ${displayDate(selectedDate)}`}>
        <h3 className="px-4 pt-5 text-sm font-semibold text-ink sm:px-6">
          {displayDate(selectedDate)}{" "}
          <span className="font-normal text-stone-500">· {selectedTasks.length} tugas</span>
        </h3>
        <div className="px-4 pt-3 sm:px-6">
          <AppButton variant="ghost" disabled={busy} onClick={() => onAdd(selectedDate)}>
            Tambah tugas pada tanggal ini
          </AppButton>
        </div>
        <div
          className="max-h-96 divide-y overflow-y-auto"
          tabIndex={0}
          aria-label="Tugas pada tanggal terpilih"
        >
          {selectedTasks.map((task) => (
            <PlanningTaskRow
              key={task.id}
              task={task}
              today={today}
              busy={busy}
              onOpen={onOpen}
              onUpdate={onUpdate}
            />
          ))}
        </div>
        {!selectedTasks.length && (
          <p className="px-4 py-6 text-sm text-stone-500 sm:px-6">
            Tidak ada tugas pada tanggal ini. Pilih tanggal lain untuk melihat persiapanmu.
          </p>
        )}
      </section>
      {undated.length > 0 && (
        <details className="mx-4 mb-5 rounded-xl border border-stone-100 bg-stone-50 sm:mx-6">
          <summary className="cursor-pointer p-4 text-sm font-medium text-stone-700">
            Belum dijadwalkan — {undated.length} tugas
          </summary>
          <p className="px-4 pb-2 text-xs text-stone-500">
            Buka tugas untuk mengatur tanggal sesuai kebutuhanmu.
          </p>
          <div
            className="max-h-80 divide-y overflow-y-auto"
            tabIndex={0}
            aria-label="Tugas belum dijadwalkan"
          >
            {undated.map((task) => (
              <PlanningTaskRow
                key={task.id}
                task={task}
                today={today}
                busy={busy}
                onOpen={onOpen}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
