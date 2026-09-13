import assert from "node:assert/strict";
import test from "node:test";
import { fromApiTask, taskQueryString, toTaskPayload } from "../src/features/planning/adapters.ts";
import { createPlanningService } from "../src/features/planning/service.ts";
import { createPlan } from "../src/features/planning/model.ts";
import type { PlanSettings, WeddingTask } from "../src/features/planning/model.ts";
import type { ApiWeddingTask, WeddingTaskQuery } from "../src/features/planning/types.ts";

const settings: PlanSettings = {
  date: "2027-06-20",
  event: "AKAD_DAN_RESEPSI",
  guests: 200,
  budget: 100000000,
  location: "Jakarta",
  traditional: false,
  outdoor: false,
  useWo: false,
};
const apiTask: ApiWeddingTask = {
  id: 12,
  order: { id: 7 },
  title: "Booking venue",
  category: "Venue",
  guide: null,
  daysBeforeEvent: 90,
  dueDate: "2027-03-22",
  customDue: false,
  important: true,
  status: "TODO",
  assignee: null,
  notes: null,
  externalVendor: null,
  sortOrder: 0,
  subtasks: [
    { id: 2, title: "Booking DP", done: false, sortOrder: 1 },
    { id: 1, title: "Survey", done: true, sortOrder: 0 },
  ],
};

test("maps backend dates, nullable fields, order IDs and subtask order without mutating the response", () => {
  const task = fromApiTask(apiTask);
  assert.equal(task.id, "12");
  assert.equal(task.orderId, "7");
  assert.equal(task.due, "2027-03-22");
  assert.equal(task.daysBefore, 90);
  assert.equal(task.vendor, "");
  assert.equal(task.notes, "");
  assert.deepEqual(
    task.subtasks.map((item) => item.title),
    ["Survey", "Booking DP"],
  );
  assert.equal(apiTask.subtasks[0].id, 2);
  const empty = fromApiTask({ ...apiTask, order: null, dueDate: null, daysBeforeEvent: null });
  assert.equal(empty.orderId, "");
  assert.equal(empty.due, "");
  assert.equal(empty.daysBefore, null);
});

test("task writes use backend field names, numeric order IDs and explicit clearing", () => {
  const payload = toTaskPayload({ ...fromApiTask(apiTask), vendor: "Vendor luar" });
  assert.equal(payload.orderId, 7);
  assert.equal(payload.daysBeforeEvent, 90);
  assert.equal(payload.dueDate, "2027-03-22");
  assert.equal(payload.externalVendor, "Vendor luar");
  assert.ok(!("id" in payload));
  assert.ok(!("due" in payload));
  const cleared = toTaskPayload({
    ...fromApiTask(apiTask),
    orderId: "",
    due: "",
    daysBefore: null,
  });
  assert.equal(cleared.orderId, null);
  assert.equal(cleared.dueDate, null);
  assert.equal(cleared.daysBeforeEvent, null);
  assert.throws(() => toTaskPayload({ ...fromApiTask(apiTask), orderId: "bad" }));
  assert.throws(() => toTaskPayload({ ...fromApiTask(apiTask), orderId: "9007199254740993" }));
});

test("query preserves server pagination, filter encoding, sorting and false booleans", () => {
  const query = new URLSearchParams(
    taskQueryString({
      filter: "bunga & dekorasi",
      category: "Busana & MUA",
      status: "TODO",
      overdue: true,
      important: false,
      sortBy: "due_desc",
      pageNumber: 3,
      pageSize: 10,
    }),
  );
  assert.equal(query.get("filter"), "bunga & dekorasi");
  assert.equal(query.get("category"), "Busana & MUA");
  assert.equal(query.get("sortBy"), "due_desc");
  assert.equal(query.get("pageNumber"), "3");
  assert.equal(query.get("important"), "false");
  assert.equal(query.get("overdue"), "true");
  assert.equal(taskQueryString({ filter: "", status: undefined }), "");
});

test("summary uses global totals, excludes skipped tasks and counts only pending important tasks", async () => {
  const requests: WeddingTaskQuery[] = [];
  const totals = [125, 30, 5, 8, 4, 3];
  const service = createPlanningService({
    async getWeddingTasks(query = {}) {
      requests.push(query);
      return { data: [], total: totals[requests.length - 1], pageNumber: 1, pageSize: 1 };
    },
    async createWeddingTask(task) {
      return task;
    },
  });
  assert.deepEqual(await service.getSummary(), {
    taskCount: 125,
    total: 120,
    completed: 30,
    pending: 90,
    overdue: 8,
    important: 7,
    percent: 25,
  });
  assert.ok(requests.every((query) => query.pageNumber === 1 && query.pageSize === 1));
  assert.deepEqual(
    requests.filter((query) => query.important).map((query) => query.status),
    ["TODO", "IN_PROGRESS"],
  );
});

test("failed count requests do not silently produce zero progress", async () => {
  const service = createPlanningService({
    async getWeddingTasks(query = {}) {
      if (query.status === "COMPLETED") throw new Error("Server unavailable");
      return { data: [], total: 0, pageNumber: 1, pageSize: 1 };
    },
    async createWeddingTask(task) {
      return task;
    },
  });
  await assert.rejects(service.getSummary(), /Server unavailable/);
});

test("full-list operations follow actual pages even when the backend caps the requested page size", async () => {
  const tasks = createPlan(settings).tasks.slice(0, 5);
  const requests: number[] = [];
  const service = createPlanningService({
    async getWeddingTasks(query = {}) {
      const page = query.pageNumber ?? 1;
      requests.push(page);
      return {
        data: tasks.slice((page - 1) * 2, page * 2),
        total: 5,
        pageNumber: page,
        pageSize: 2,
      };
    },
    async createWeddingTask(task) {
      return task;
    },
  });
  assert.deepEqual(await service.getAllTasks(), tasks);
  assert.deepEqual(requests, [1, 2, 3]);
});

test("export refuses incomplete or repeated pages instead of looping or silently truncating", async () => {
  const service = createPlanningService({
    async getWeddingTasks() {
      return { data: [fromApiTask(apiTask)], total: 5, pageNumber: 1, pageSize: 1 };
    },
    async createWeddingTask(task) {
      return task;
    },
  });
  await assert.rejects(service.getAllTasks(), /belum lengkap/);
});

test("template retry preserves saved tasks and renamed tasks, including progress and notes", async () => {
  const saved: WeddingTask[] = [];
  let shouldFail = true;
  const service = createPlanningService({
    async getWeddingTasks() {
      return { data: [...saved], total: saved.length, pageNumber: 1, pageSize: 100 };
    },
    async createWeddingTask(task) {
      if (saved.length === 2 && shouldFail) {
        shouldFail = false;
        throw new Error("Disconnected");
      }
      const created = { ...task, id: String(saved.length + 1) };
      saved.push(created);
      return created;
    },
  });
  await assert.rejects(service.addTemplateTasks(settings), /Checklist belum lengkap/);
  assert.equal(saved.length, 2);
  saved[0] = { ...saved[0], title: "Judul diubah", status: "COMPLETED", notes: "Tetap disimpan" };
  await service.addTemplateTasks(settings);
  assert.equal(saved.length, createPlan(settings).tasks.length);
  assert.equal(saved[0].notes, "Tetap disimpan");
  assert.equal(saved[0].status, "COMPLETED");
  await service.addTemplateTasks({ ...settings, outdoor: true });
  assert.equal(saved.length, createPlan(settings).tasks.length + 1);
  await service.addTemplateTasks({ ...settings, outdoor: false });
  assert.equal(saved.length, createPlan(settings).tasks.length + 1);
});
