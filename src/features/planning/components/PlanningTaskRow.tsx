"use client";

import { ChevronRight, Flag } from "lucide-react";
import { statuses, isPending, setTaskStatus, type WeddingTask } from "../model";
import { dueLabel } from "../format";
import { cn } from "@/shared/utils/cn";

export function PlanningTaskRow({
  task,
  today,
  busy,
  onOpen,
  onUpdate,
}: {
  task: WeddingTask;
  today: string;
  busy: boolean;
  onOpen: (id: string) => void;
  onUpdate: (task: WeddingTask) => Promise<void>;
}) {
  const late = isPending(task) && task.due && task.due < today;
  return (
    <div className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-stone-50/70 sm:px-6">
      <input
        type="checkbox"
        aria-label={`Tandai ${task.title} selesai`}
        disabled={busy}
        checked={task.status === "COMPLETED"}
        onChange={(event) =>
          void onUpdate(setTaskStatus(task, event.target.checked ? "COMPLETED" : "TODO"))
        }
        className="size-5 shrink-0 cursor-pointer accent-blush"
      />
      <button
        onClick={() => onOpen(task.id)}
        className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-rose-400"
      >
        <span
          className={cn(
            "block text-sm font-medium",
            task.status === "COMPLETED" || task.status === "SKIPPED"
              ? "text-stone-400 line-through"
              : "text-ink",
          )}
        >
          {task.title}
        </span>
        <span
          className={cn("mt-1 block text-xs leading-5", late ? "text-red-700" : "text-stone-500")}
        >
          {dueLabel(task, today)} · {task.assignee || "Belum ditugaskan"}
          {task.subtasks.length > 0 &&
            ` · ${task.subtasks.filter((item) => item.done).length}/${task.subtasks.length} langkah`}
        </span>
        {(task.guide || task.notes) && (
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-stone-500">
            {task.guide || task.notes}
          </span>
        )}
        <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-stone-500">{task.category}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5",
              task.status === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700"
                : task.status === "IN_PROGRESS"
                  ? "bg-rose-50 text-blush"
                  : "bg-stone-100 text-stone-600",
            )}
          >
            {statuses[task.status]}
          </span>
          {task.important && (
            <span className="inline-flex items-center gap-1 text-blush">
              <Flag size={11} /> Penting
            </span>
          )}
        </span>
      </button>
      <button
        aria-label={`Buka detail ${task.title}`}
        onClick={() => onOpen(task.id)}
        className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-blush"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
