"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";

import { ChevronRight, Flag } from "lucide-react";
import { statuses, isPending, setTaskStatus, type WeddingTask } from "../model";
import { planningTaskText } from "../taskCopy";
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
  const { translateText, locale } = useTranslation();
  const late = isPending(task) && task.due && task.due < today;
  return (
    <div className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-stone-50/70 sm:px-6">
      <input
        type="checkbox"
        aria-label={translateText("Tandai {0} selesai", {
          0: planningTaskText(task, task.title, locale),
        })}
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
              ? "text-stone-600 line-through"
              : "text-ink",
          )}
        >
          {planningTaskText(task, task.title, locale)}
        </span>
        <span
          className={cn("mt-1 block text-xs leading-5", late ? "text-red-700" : "text-stone-600")}
        >
          {dueLabel(task, today, locale)} · {task.assignee || translateText("Belum ditugaskan")}
          {task.subtasks.length > 0 &&
            translateText(" · {0}/{1} langkah", {
              0: task.subtasks.filter((item) => item.done).length,
              1: task.subtasks.length,
            })}
        </span>
        {(task.guide || task.notes) && (
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-stone-600">
            {task.guide ? planningTaskText(task, task.guide, locale) : task.notes}
          </span>
        )}
        <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-stone-600">{translateText(task.category)}</span>
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
            {translateText(statuses[task.status])}
          </span>
          {task.important && (
            <span className="inline-flex items-center gap-1 text-blush">
              <Flag size={11} /> {translateText("Penting")}{" "}
            </span>
          )}
        </span>
      </button>
      <button
        aria-label={translateText("Buka detail {0}", {
          0: planningTaskText(task, task.title, locale),
        })}
        onClick={() => onOpen(task.id)}
        className="rounded-lg p-2 text-stone-600 hover:bg-rose-50 hover:text-blush"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
