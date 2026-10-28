import assert from "node:assert/strict";
import test from "node:test";
import {
  overdueTasks,
  overdueMonthLabels,
  calendarStatusCounts,
  calendarDays,
  moveMonth,
  tasksByDate,
  upcomingTasks,
} from "../src/features/planning/calendar.ts";
import { createPlan } from "../src/features/planning/model.ts";
import { createPlanningService } from "../src/features/planning/service.ts";
import type { WeddingTaskQuery } from "../src/features/planning/types.ts";

const base = createPlan({
  date: "2027-06-20",
  event: "RESEPSI",
  guests: 100,
  budget: 10000000,
  location: "Jakarta",
  traditional: false,
  outdoor: false,
  useWo: false,
}).tasks[0];

test("calendar uses Monday-first date-only cells through leap days and year boundaries", () => {
  const leap = calendarDays("2028-02");
  assert.equal(leap.length, 42);
  assert.equal(leap[0], "2028-01-31");
  assert.ok(leap.includes("2028-02-29"));
  assert.equal(new Set(leap).size, 42);
  assert.equal(calendarDays("2027-11")[0], "2027-11-01");
  assert.equal(moveMonth("2027-12", 1), "2028-01");
  assert.equal(moveMonth("2028-01", -1), "2027-12");
  assert.deepEqual(calendarDays("2027-13"), []);
});

test("calendar groups dated tasks without losing statuses or altering undated checklist data", () => {
  const tasks = [
    { ...base, id: "1", due: "2027-06-01", status: "TODO" as const },
    { ...base, id: "2", due: "2027-06-01", status: "COMPLETED" as const },
    { ...base, id: "3", due: "", status: "SKIPPED" as const },
    { ...base, id: "4", due: "2027-06-02", status: "IN_PROGRESS" as const },
  ];
  const before = structuredClone(tasks);
  const grouped = tasksByDate(tasks);
  assert.deepEqual(
    grouped.get("2027-06-01")?.map((task) => task.id),
    ["1", "2"],
  );
  assert.ok(!grouped.has(""));
  assert.equal(upcomingTasks(tasks, "2027-06-01"), 2);
  assert.equal(upcomingTasks(tasks, "2027-06-02"), 1);
  assert.deepEqual(tasks, before);
});

test("shared calendar/list collection preserves server filters on every page and reloads fresh data", async () => {
  let tasks = Array.from({ length: 13 }, (_, index) => ({
    ...base,
    id: String(index),
    due: index === 12 ? "" : "2027-06-01",
  }));
  const requests: WeddingTaskQuery[] = [];
  const service = createPlanningService({
    async getWeddingTasks(query = {}) {
      requests.push(query);
      const page = query.pageNumber ?? 1;
      return {
        data: tasks.slice((page - 1) * 5, page * 5),
        total: tasks.length,
        pageNumber: page,
        pageSize: 5,
      };
    },
    async createWeddingTask(task) {
      return task;
    },
  });
  const filters = {
    filter: "venue",
    category: "Venue",
    status: "TODO" as const,
    overdue: true,
    sortBy: "due_desc" as const,
  };
  const result = await service.getAllTasks(filters);
  assert.equal(result.length, 13);
  assert.equal(result[12].due, "");
  assert.equal(tasksByDate(result).get("2027-06-01")?.length, 12);
  assert.deepEqual(
    requests.map((query) => query.pageNumber),
    [1, 2, 3],
  );
  for (const query of requests)
    for (const [key, value] of Object.entries(filters))
      assert.equal(query[key as keyof WeddingTaskQuery], value);
  tasks = [{ ...base, id: "new", title: "Edited", status: "COMPLETED" }];
  assert.deepEqual(await service.getAllTasks(filters), tasks);
});

test("overdue is global across months, excludes completed/skipped/today, and never mutates deadlines", () => {
  const tasks = [
    { ...base, id: "a", due: "2026-09-10", status: "TODO" as const },
    { ...base, id: "b", due: "2026-09-19", status: "IN_PROGRESS" as const },
    { ...base, id: "c", due: "2026-10-12", status: "TODO" as const },
    { ...base, id: "d", due: "2026-10-25", status: "TODO" as const },
    { ...base, id: "e", due: "2026-10-20", status: "TODO" as const },
    { ...base, id: "f", due: "2026-09-01", status: "COMPLETED" as const },
    { ...base, id: "g", due: "2026-09-02", status: "SKIPPED" as const },
    { ...base, id: "h", due: "", status: "TODO" as const },
  ];
  const original = structuredClone(tasks);
  assert.deepEqual(
    overdueTasks(tasks, "2026-10-20").map((task) => task.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(overdueMonthLabels(overdueTasks(tasks, "2026-10-20")), [
    "2 tugas dari September 2026",
    "1 tugas dari Oktober 2026",
  ]);
  for (const month of ["2026-09", "2026-10", "2026-11", "2027-01"]) {
    calendarDays(month);
    assert.equal(overdueTasks(tasks, "2026-10-20").length, 3);
  }
  assert.equal(
    overdueTasks(
      tasks.map((t) => (t.id === "a" ? { ...t, status: "COMPLETED" } : t)),
      "2026-10-20",
    ).length,
    2,
  );
  assert.equal(
    overdueTasks(
      tasks.map((t) => (t.due && t.due < "2026-10-20" ? { ...t, status: "COMPLETED" } : t)),
      "2026-10-20",
    ).length,
    0,
  );
  assert.deepEqual(tasks, original);
  assert.equal(
    overdueTasks([{ ...base, due: "2026-12-31", status: "TODO" }], "2027-01-01").length,
    1,
  );
});

test("calendar displays mixed status counts without inferring or writing business statuses", () => {
  const tasks = [
    { ...base, due: "2026-10-19", status: "TODO" as const },
    { ...base, due: "2026-10-20", status: "IN_PROGRESS" as const },
    { ...base, due: "2026-10-19", status: "COMPLETED" as const },
    { ...base, due: "2026-10-19", status: "SKIPPED" as const },
  ];
  assert.deepEqual(calendarStatusCounts(tasks, "2026-10-20"), {
    overdue: 1,
    pending: 1,
    completed: 1,
    skipped: 1,
  });
  assert.deepEqual(calendarStatusCounts([], "2026-10-20"), {
    overdue: 0,
    pending: 0,
    completed: 0,
    skipped: 0,
  });
});
