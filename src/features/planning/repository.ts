import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import { fromApiTask, taskQueryString, toTaskPayload } from "./adapters";
import type { WeddingTask } from "./model";
import type {
  ApiWeddingPlan,
  ApiWeddingTask,
  TaskPage,
  WeddingPlanPreferences,
  WeddingTaskPayload,
  WeddingTaskQuery,
} from "./types";

export function getWeddingPlan() {
  return authenticatedDataRequest<ApiWeddingPlan>(API_ROUTES.weddingPlans.root);
}

export function saveWeddingPlan(preferences: WeddingPlanPreferences) {
  return authenticatedDataRequest<ApiWeddingPlan>(API_ROUTES.weddingPlans.root, {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

export async function getWeddingTasks(query: WeddingTaskQuery = {}): Promise<TaskPage> {
  const page = await authenticatedDataRequest<TaskPage<ApiWeddingTask>>(
    `${API_ROUTES.weddingTasks.root}${taskQueryString(query)}`,
  );
  return { ...page, data: page.data.map(fromApiTask) };
}

export async function getWeddingTask(id: string) {
  const task = await authenticatedDataRequest<ApiWeddingTask>(API_ROUTES.weddingTasks.byId(id));
  return fromApiTask(task);
}

export async function createWeddingTask(task: WeddingTask) {
  const result = await authenticatedDataRequest<ApiWeddingTask>(API_ROUTES.weddingTasks.root, {
    method: "POST",
    body: JSON.stringify(toTaskPayload(task)),
  });
  return fromApiTask(result);
}

export async function updateWeddingTask(id: string, payload: Partial<WeddingTaskPayload>) {
  const result = await authenticatedDataRequest<ApiWeddingTask>(API_ROUTES.weddingTasks.byId(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return fromApiTask(result);
}
