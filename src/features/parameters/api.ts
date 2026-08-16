import type { ParameterPayload, SystemParameter } from "@/features/parameters/types";
import {
  authenticatedDataRequest,
  authenticatedRequest,
} from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";

interface ParameterPage {
  data: SystemParameter[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

const PARAMETER_FETCH_LIMIT = 1000;

export async function getParameters(filter = "", pageNumber = 1, pageSize = 10) {
  // Backend memuat relasi one-to-many `details` pada query yang sama dengan pagination.
  // Ambil header dalam satu batch lalu lakukan pagination berdasarkan header agar banyaknya
  // detail tidak membuat header lain hilang dari halaman.
  const result = await fetchParameterPage(filter, 1, PARAMETER_FETCH_LIMIT);
  const start = (pageNumber - 1) * pageSize;
  return {
    ...result,
    data: result.data.slice(start, start + pageSize),
    pageNumber,
    pageSize,
    total: result.total,
  };
}

export async function getActiveParameterDetails(code: string) {
  const parameters = await getActiveParameterDetailsByCodes([code]);
  return parameters.get(normalizeParameterValue(code)) ?? [];
}

export async function getActiveParameterDetailsByCodes(codes: string[]) {
  const parameters = new Map<string, SystemParameter["details"]>();

  await Promise.all(
    codes.map(async (code) => {
      const normalizedCode = normalizeParameterValue(code);
      const result = await fetchParameterPage(code, 1, 10);
      const parameter = result.data.find(
        (item) => item.active && normalizeParameterValue(item.code) === normalizedCode,
      );
      if (!parameter) return;
      parameters.set(
        normalizedCode,
        parameter.details
          .filter((detail) => detail.active)
          .sort((first, second) => first.ordering - second.ordering),
      );
    }),
  );

  return parameters;
}

export async function createParameter(data: ParameterPayload) {
  return authenticatedDataRequest<SystemParameter>(API_ROUTES.parameters.root, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateParameter(id: string, data: Partial<ParameterPayload>) {
  return authenticatedDataRequest<SystemParameter>(API_ROUTES.parameters.byId(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteParameter(id: string) {
  await authenticatedRequest(API_ROUTES.parameters.byId(id), { method: "DELETE" });
}

async function fetchParameterPage(filter: string, pageNumber: number, pageSize: number) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  if (filter) query.set("filter", filter);
  return authenticatedDataRequest<ParameterPage>(`${API_ROUTES.parameters.root}?${query}`);
}

function normalizeParameterValue(value: string) {
  return value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").toUpperCase();
}
