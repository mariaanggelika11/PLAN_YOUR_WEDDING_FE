import { createPlan } from "./model.ts";
import type { PlanSettings, WeddingTask } from "./model";
import type { ProgressSummary, WeddingTaskQuery } from "./types";
import type * as repository from "./repository";

type PlanningRepository = Pick<typeof repository, "getWeddingTasks" | "createWeddingTask">;

/** The API currently exposes counts through paginated lists, not a summary endpoint. */
export function createPlanningService(api: PlanningRepository) {
  async function getSummary(): Promise<ProgressSummary> {
    const queries: WeddingTaskQuery[] = [
      {},
      { status: "COMPLETED" },
      { status: "SKIPPED" },
      { overdue: true },
      { important: true, status: "TODO" },
      { important: true, status: "IN_PROGRESS" },
    ];
    const results = await Promise.allSettled(
      queries.map((query) => api.getWeddingTasks({ ...query, pageNumber: 1, pageSize: 1 })),
    );
    const counts = results.map((result) => {
      if (result.status === "rejected") throw result.reason;
      return result.value.total;
    });
    const [taskCount, completed, skipped, overdue, importantTodo, importantInProgress] = counts;
    const total = Math.max(0, taskCount - skipped);
    return {
      taskCount,
      total,
      completed,
      overdue,
      pending: Math.max(0, total - completed),
      important: importantTodo + importantInProgress,
      percent: total ? Math.round((completed / total) * 100) : 0,
    };
  }

  /** Only exports and template reconciliation require the full list. Normal browsing is paginated. */
  async function getAllTasks(): Promise<WeddingTask[]> {
    const tasks = new Map<string, WeddingTask>();
    for (let pageNumber = 1; ; pageNumber += 1) {
      const page = await api.getWeddingTasks({ pageNumber, pageSize: 100, sortBy: "due_asc" });
      const before = tasks.size;
      for (const task of page.data) tasks.set(task.id, task);
      if (tasks.size >= page.total) return [...tasks.values()];
      if (tasks.size === before) throw new Error("Daftar tugas belum lengkap. Silakan coba lagi.");
    }
  }

  async function addTemplateTasks(settings: PlanSettings) {
    const existing = await getAllTasks();
    const templates = createPlan(settings).tasks;
    // No templateId or bulk-create endpoint is available. Match stable template content
    // as well as titles so a retry preserves successfully created/renamed tasks.
    for (const template of templates) {
      if (
        existing.some(
          (task) =>
            (task.category === template.category && task.title === template.title) ||
            (task.guide === template.guide && task.daysBefore === template.daysBefore),
        )
      )
        continue;
      try {
        existing.push(await api.createWeddingTask(template));
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Server tidak dapat dihubungi.";
        throw new Error(
          `Checklist belum lengkap. Tugas yang sudah tersimpan tetap tersedia. Coba simpan kembali untuk melanjutkan. ${reason}`,
        );
      }
    }
  }

  return { getSummary, getAllTasks, addTemplateTasks };
}
