"use client";

import { AlertCircle } from "lucide-react";
import { overdueTasks, overdueMonthLabels } from "../calendar";
import type { WeddingTask } from "../model";
import { PlanningTaskRow } from "./PlanningTaskRow";

export function OverdueReminder({
  tasks,
  today,
  busy,
  onOpen,
  onUpdate,
}: {
  tasks: WeddingTask[];
  today: string;
  busy: boolean;
  onOpen: (id: string) => void;
  onUpdate: (task: WeddingTask) => Promise<void>;
}) {
  const overdue = overdueTasks(tasks, today);
  if (!overdue.length) return null;
  return (
    <details
      className="overflow-hidden rounded-xl border border-red-200 bg-white"
      aria-label="Pengingat tugas terlambat"
    >
      <summary className="cursor-pointer bg-red-50/70 p-4 text-sm text-red-900 focus-visible:outline-red-500">
        <span className="ml-1 inline-flex items-center gap-2 font-semibold">
          <AlertCircle size={17} aria-hidden="true" />
          {overdue.length} tugas melewati deadline
        </span>
        <span className="mt-1 block pl-5 text-xs leading-5 text-red-700">
          {overdueMonthLabels(overdue).join(" · ")}
        </span>
        <span className="mt-1 block pl-5 text-xs text-red-700">Lihat tugas terlambat</span>
      </summary>
      <div
        className="max-h-80 divide-y overflow-y-auto"
        tabIndex={0}
        aria-label="Daftar tugas terlambat"
      >
        {overdue.map((task) => (
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
  );
}
