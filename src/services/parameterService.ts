import { API_ROUTES } from "@/constants/apiRoutes";
import { apiRequest } from "@/services/api";
import { getSession } from "@/services/authService";
import type { ApiResponse } from "@/types/api";
import type { ParameterPayload, SystemParameter } from "@/types/parameter";

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
  const query = new URLSearchParams({
    pageNumber: "1",
    pageSize: String(PARAMETER_FETCH_LIMIT),
  });
  if (filter) query.set("filter", filter);
  const response = await apiRequest<ApiResponse<ParameterPage>>(
    `${API_ROUTES.parameters.root}?${query}`,
    { headers: authHeader() },
  );
  const start = (pageNumber - 1) * pageSize;
  return {
    ...response.data,
    data: response.data.data.slice(start, start + pageSize),
    pageNumber,
    pageSize,
    total: response.data.total,
  };
}

export async function getActiveParameterDetails(code: string) {
  const parameters = await getActiveParameterDetailsByCodes([code]);
  return parameters.get(normalizeParameterValue(code)) ?? [];
}

export async function getActiveParameterDetailsByCodes(codes: string[]) {
  const normalizedCodes = new Set(codes.map(normalizeParameterValue));
  const result = await getParameters("", 1, PARAMETER_FETCH_LIMIT);
  const parameters = new Map<string, SystemParameter["details"]>();

  result.data.forEach((parameter) => {
    const normalizedCode = normalizeParameterValue(parameter.code);
    if (!parameter.active || !normalizedCodes.has(normalizedCode)) return;
    parameters.set(
      normalizedCode,
      parameter.details
        .filter((detail) => detail.active)
        .sort((first, second) => first.ordering - second.ordering),
    );
  });

  return parameters;
}

export async function createParameter(data: ParameterPayload) {
  const response = await apiRequest<ApiResponse<SystemParameter>>(API_ROUTES.parameters.root, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateParameter(id: string, data: Partial<ParameterPayload>) {
  const response = await apiRequest<ApiResponse<SystemParameter>>(API_ROUTES.parameters.byId(id), {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteParameter(id: string) {
  await apiRequest(API_ROUTES.parameters.byId(id), { method: "DELETE", headers: authHeader() });
}

function authHeader() {
  const session = getSession();
  if (!session) throw new Error("Sesi login tidak ditemukan.");
  return { Authorization: `Bearer ${session.accessToken}` };
}

function normalizeParameterValue(value: string) {
  return value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").toUpperCase();
}
