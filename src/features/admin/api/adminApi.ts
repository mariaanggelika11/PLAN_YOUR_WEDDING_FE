import { readAllPages } from "@/shared/api/readAllPages";
import type {
  AdminUser,
  AdminUserRole,
  PaginatedData,
  VendorAdminProfile,
} from "@/features/admin/types";
import { featureDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";

export async function getAdminUsers(query: AdminListQuery = {}) {
  const [users, roles] = await Promise.all([
    getPage<AdminUser>(API_ROUTES.users.root, query),
    readAllPages((pageNumber) =>
      getPage<AdminUserRole>(API_ROUTES.userRoles.root, { pageNumber, pageSize: 100 }),
    ),
  ]);
  const rolesByUser = new Map<number, string[]>();
  roles.forEach((role) => {
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
  if (vendor.status !== 2) throw new Error("Vendor tidak sedang menunggu verifikasi.");
  if (decision === "reject" && !reason?.trim()) throw new Error("Alasan penolakan wajib diisi.");
  return request<VendorAdminProfile>(
    `${API_ROUTES.profile.vendorById(vendor.id)}/${decision === "approve" ? "verify" : "reject"}`,
    {
      method: "PUT",
      ...(decision === "reject" ? { body: JSON.stringify({ rejectReason: reason!.trim() }) } : {}),
    },
  );
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
  return featureDataRequest<T>(endpoint, init, "Data admin gagal diproses.");
}
