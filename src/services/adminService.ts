import { API_ROUTES } from "@/constants/apiRoutes";
import { ApiError } from "@/services/api";
import { authenticatedDataRequest } from "@/services/authenticatedApi";
import type { AdminUser, AdminUserRole, PaginatedData, VendorAdminProfile } from "@/types/admin";

export class AdminServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminServiceError";
  }
}

export async function getAdminUsers(query: AdminListQuery = {}) {
  const [users, roles] = await Promise.all([
    getPage<AdminUser>(API_ROUTES.users.root, query),
    getPage<AdminUserRole>(API_ROUTES.userRoles.root, {
      filter: query.filter,
      pageNumber: 1,
      pageSize: 1000,
    }),
  ]);
  const rolesByUser = new Map<number, string[]>();
  roles.data.forEach((role) => {
    rolesByUser.set(role.userId, [...(rolesByUser.get(role.userId) ?? []), role.roleName]);
  });
  return {
    ...users,
    data: users.data.map((user) => ({ ...user, roles: rolesByUser.get(user.id) ?? [] })),
  };
}

export function updateUserActive(userId: number, active: boolean) {
  return request<AdminUser>(API_ROUTES.users.byId(userId), {
    method: "PUT",
    body: JSON.stringify({ active }),
  });
}

export function getAdminVendors(query: AdminListQuery = {}) {
  return getPage<VendorAdminProfile>(API_ROUTES.profile.vendor, query);
}

export function getAdminVendor(id: number) {
  return request<VendorAdminProfile>(API_ROUTES.profile.vendorById(id));
}

export async function verifyVendor(
  vendor: VendorAdminProfile,
  decision: "approve" | "reject",
  reason?: string,
) {
  const approved = decision === "approve";
  const status = approved ? 3 : 4;
  const rejectReason = approved ? "" : reason?.trim();

  await Promise.all(
    (vendor.verificationDocuments ?? []).map((document) =>
      request(API_ROUTES.verificationDocuments.byId(document.id), {
        method: "PUT",
        body: JSON.stringify({ status, rejectReason }),
      }),
    ),
  );
  return request<VendorAdminProfile>(API_ROUTES.profile.vendorById(vendor.id), {
    method: "PUT",
    body: JSON.stringify({ status, isVerified: approved, rejectReason }),
  });
}

interface AdminListQuery {
  filter?: string;
  pageNumber?: number;
  pageSize?: number;
}

async function getPage<T>(endpoint: string, query: AdminListQuery): Promise<PaginatedData<T>> {
  const params = new URLSearchParams();
  if (query.filter) params.set("filter", query.filter);
  params.set("pageNumber", String(query.pageNumber ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));
  return request<PaginatedData<T>>(`${endpoint}?${params}`);
}

async function request<T>(endpoint: string, init?: RequestInit) {
  try {
    return await authenticatedDataRequest<T>(endpoint, init);
  } catch (error) {
    if (error instanceof ApiError) throw new AdminServiceError(error.message);
    throw new AdminServiceError("Data admin gagal diproses.");
  }
}
