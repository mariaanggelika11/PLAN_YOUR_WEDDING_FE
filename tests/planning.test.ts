import assert from "node:assert/strict";
import test from "node:test";
import {
  createPlan,
  dateOffset,
  daysUntil,
  focusTasks,
  parsePlan,
  reschedule,
  setTaskStatus,
  taskSummary,
  toggleSubtask,
  updateSettings,
  type PlanSettings,
} from "../src/features/planning/model.ts";
const settings: PlanSettings = {
  date: "2027-06-01",
  event: "Akad dan resepsi",
  guests: 200,
  budget: 100000000,
  location: "Jakarta",
  traditional: false,
  outdoor: false,
  useWo: false,
};
test("template includes full lifecycle and only chosen optional preparations", () => {
  const base = createPlan(settings);
  assert.ok(base.tasks.length >= 25);
  assert.ok(
    base.tasks.some((task) => task.category === "Setelah acara" && task.due > settings.date),
  );
  assert.ok(!base.tasks.some((task) => ["wo", "rain", "tradition"].includes(task.id)));
  const full = createPlan({ ...settings, traditional: true, outdoor: true, useWo: true });
  assert.equal(full.tasks.length, base.tasks.length + 3);
  assert.equal(new Set(full.tasks.map((task) => task.id)).size, full.tasks.length);
});
test("date calculations handle leap years, year boundaries and missing date", () => {
  assert.equal(dateOffset("2028-03-01", -1), "2028-02-29");
  assert.equal(dateOffset("2027-01-01", -1), "2026-12-31");
  assert.equal(dateOffset("2027-02-30", 0), "");
  assert.equal(dateOffset("", -20), "");
  assert.equal(daysUntil("2027-01-01", "2026-12-31"), 1);
  assert.ok(createPlan({ ...settings, date: "" }).tasks.every((task) => task.due === ""));
});
test("skipped tasks do not inflate progress and empty lists stay finite", () => {
  const tasks = createPlan(settings).tasks.slice(0, 3);
  tasks[0].status = "COMPLETED";
  tasks[1].status = "SKIPPED";
  assert.deepEqual(taskSummary(tasks), { completed: 1, total: 2, percent: 50 });
  assert.deepEqual(taskSummary([]), { completed: 0, total: 0, percent: 0 });
});
test("rescheduling preserves manual dates and finished tasks", () => {
  const tasks = createPlan(settings).tasks.slice(0, 3);
  tasks[1].customDue = true;
  tasks[2].status = "COMPLETED";
  const next = reschedule(tasks, "2027-07-01");
  assert.notEqual(next[0].due, tasks[0].due);
  assert.equal(next[1].due, tasks[1].due);
  assert.equal(next[2].due, tasks[2].due);
  const plan = { ...createPlan(settings), tasks };
  assert.equal(
    updateSettings(plan, { ...settings, date: "2027-07-01" }, false).tasks[0].due,
    tasks[0].due,
  );
});
test("settings do not duplicate tasks or overwrite progress and notes", () => {
  const base = createPlan(settings);
  base.tasks[0].notes = "Sudah dibahas";
  base.tasks[0].status = "COMPLETED";
  const next = updateSettings(base, { ...settings, outdoor: true }, true);
  const repeat = updateSettings(next, { ...settings, outdoor: true }, true);
  assert.equal(next.tasks.length, repeat.tasks.length);
  assert.equal(repeat.tasks[0].notes, "Sudah dibahas");
  assert.equal(repeat.tasks[0].status, "COMPLETED");
});
test("focus prioritizes overdue tasks and excludes completed and skipped", () => {
  const tasks = createPlan(settings).tasks.slice(0, 5);
  tasks[0].status = "COMPLETED";
  tasks[1].status = "SKIPPED";
  tasks[2].due = "2027-05-15";
  tasks[3].due = "2027-05-01";
  tasks[4].due = "2027-05-08";
  assert.deepEqual(
    focusTasks(tasks, "2027-05-05").map((task) => task.id),
    [tasks[3].id, tasks[4].id, tasks[2].id],
  );
});
test("subtasks and parent status stay consistent when completed and reopened", () => {
  let task = createPlan(settings).tasks[0];
  task = toggleSubtask(task, 0);
  assert.equal(task.status, "IN_PROGRESS");
  task = setTaskStatus(task, "COMPLETED");
  assert.ok(task.subtasks.every((subtask) => subtask.done));
  task = toggleSubtask(task, 0);
  assert.equal(task.status, "IN_PROGRESS");
  task = setTaskStatus(setTaskStatus(task, "COMPLETED"), "TODO");
  assert.ok(task.subtasks.every((subtask) => !subtask.done));
});
test("stored plans roundtrip and malformed storage is rejected", () => {
  const plan = createPlan(settings);
  assert.deepEqual(parsePlan(JSON.stringify(plan)), plan);
  assert.throws(() => parsePlan('{"version":1,"settings":{},"tasks":[]}'));
  assert.throws(() =>
    parsePlan(JSON.stringify({ ...plan, tasks: [plan.tasks[0], plan.tasks[0]] })),
  );
  assert.throws(() =>
    parsePlan(JSON.stringify({ ...plan, tasks: [{ ...plan.tasks[0], status: "unknown" }] })),
  );
  assert.throws(() => parsePlan("bad json"));
});
