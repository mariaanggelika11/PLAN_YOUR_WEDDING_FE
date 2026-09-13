import type { WeddingTask } from "./model";
import type { ApiWeddingTask, WeddingTaskPayload, WeddingTaskQuery } from "./types";

export function fromApiTask(task: ApiWeddingTask): WeddingTask {
  return {
    id: String(task.id),
    title: task.title,
    category: task.category,
    guide: task.guide ?? "",
    daysBefore: task.daysBeforeEvent ?? null,
    due: task.dueDate?.slice(0, 10) ?? "",
    customDue: task.customDue,
    important: task.important,
    status: task.status,
    assignee: task.assignee ?? "",
    notes: task.notes ?? "",
    vendor: task.externalVendor ?? "",
    orderId: task.order ? String(task.order.id) : "",
    subtasks: [...(task.subtasks ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ title, done }) => ({ title, done })),
  };
}

export function toTaskPayload(task: WeddingTask): WeddingTaskPayload {
  const orderId = task.orderId ? Number(task.orderId) : null;
  if (orderId !== null && (!Number.isSafeInteger(orderId) || orderId <= 0)) {
    throw new Error("Pesanan terkait tidak valid. Pilih kembali pesanan yang ingin ditautkan.");
  }
  return {
    title: task.title.trim(),
    category: task.category,
    guide: task.guide,
    daysBeforeEvent: task.daysBefore,
    dueDate: task.due || null,
    customDue: task.customDue,
    important: task.important,
    status: task.status,
    assignee: task.assignee,
    notes: task.notes,
    externalVendor: task.vendor,
    orderId,
    subtasks: task.subtasks.map(({ title, done }) => ({ title, done })),
  };
}

export function taskQueryString(query: WeddingTaskQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.size ? `?${params}` : "";
}
