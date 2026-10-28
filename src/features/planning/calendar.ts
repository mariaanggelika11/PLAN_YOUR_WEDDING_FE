import { dateOffset, isPending, type WeddingTask } from "./model.ts";

export function calendarDays(month: string) {
  const first = `${month}-01`;
  if (!dateOffset(first, 0)) return [];
  const weekday = new Date(`${first}T00:00:00Z`).getUTCDay();
  const start = dateOffset(first, -((weekday + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => dateOffset(start, index));
}

export function moveMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function tasksByDate(tasks: WeddingTask[]) {
  const groups = new Map<string, WeddingTask[]>();
  for (const task of tasks) {
    if (!task.due) continue;
    groups.set(task.due, [...(groups.get(task.due) ?? []), task]);
  }
  return groups;
}

export function upcomingTasks(tasks: WeddingTask[], today: string) {
  return tasks.filter((task) => isPending(task) && task.due && task.due >= today).length;
}

export function overdueTasks(tasks: WeddingTask[], today: string) {
  return tasks
    .filter((task) => isPending(task) && task.due && task.due < today)
    .sort((a, b) => a.due.localeCompare(b.due));
}

export function calendarStatusCounts(tasks: WeddingTask[], today: string) {
  return {
    overdue: overdueTasks(tasks, today).length,
    pending: upcomingTasks(tasks, today),
    completed: tasks.filter((task) => task.status === "COMPLETED").length,
    skipped: tasks.filter((task) => task.status === "SKIPPED").length,
  };
}

export function overdueMonthLabels(tasks: WeddingTask[]) {
  const groups = new Map<string, number>();
  for (const task of tasks) {
    const month = task.due.slice(0, 7);
    groups.set(month, (groups.get(month) ?? 0) + 1);
  }
  return [...groups].map(
    ([month, count]) =>
      `${count} tugas dari ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`))}`,
  );
}
