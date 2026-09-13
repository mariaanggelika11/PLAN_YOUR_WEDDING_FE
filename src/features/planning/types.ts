import type { TaskStatus, WeddingTask } from "./model";

export interface WeddingPlanPreferences {
  traditional: boolean;
  outdoor: boolean;
  useWo: boolean;
  autoReschedule: boolean;
}

export interface ApiWeddingPlan extends WeddingPlanPreferences {
  id: number;
}

export interface ApiWeddingTask {
  id: string | number;
  order: { id: string | number } | null;
  title: string;
  category: string;
  guide: string | null;
  daysBeforeEvent: number | null;
  dueDate: string | null;
  customDue: boolean;
  important: boolean;
  status: TaskStatus;
  assignee: string | null;
  notes: string | null;
  externalVendor: string | null;
  sortOrder: number;
  subtasks: { id: string | number; title: string; done: boolean; sortOrder: number }[];
}

export interface WeddingTaskPayload {
  title: string;
  category: string;
  guide: string;
  daysBeforeEvent: number | null;
  dueDate: string | null;
  customDue: boolean;
  important: boolean;
  status: TaskStatus;
  assignee: string;
  notes: string;
  externalVendor: string;
  orderId: number | null;
  subtasks: { title: string; done: boolean }[];
}

export interface WeddingTaskQuery {
  filter?: string;
  category?: string;
  status?: TaskStatus;
  important?: boolean;
  overdue?: boolean;
  sortBy?: "due_asc" | "due_desc";
  pageNumber?: number;
  pageSize?: number;
}

export interface TaskPage<T = WeddingTask> {
  data: T[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

export interface ProgressSummary {
  taskCount: number;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  important: number;
  percent: number;
}
