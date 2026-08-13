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

export async function getParameters(filter = "", pageNumber = 1, pageSize = 10) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  if (filter) query.set("filter", filter);
  const response = await apiRequest<ApiResponse<ParameterPage>>(
    `${API_ROUTES.parameters.root}?${query}`,
    { headers: authHeader() },
  );
  return response.data;
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
