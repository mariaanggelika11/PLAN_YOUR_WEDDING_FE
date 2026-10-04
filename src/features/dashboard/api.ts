import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import type { Order } from "@/features/orders/types";
import type { BudgetSummary } from "@/features/budget/api";
type RecentOrder = Pick<
  Order,
  "id" | "orderNumber" | "status" | "totalAmount" | "customer" | "vendor"
>;
interface Base {
  recentOrders: RecentOrder[];
  orders: {
    total: number;
    byStatus: Record<string, number>;
    active?: number;
    completed?: number;
    incoming?: number;
    inProgress?: number;
  };
}
export type DashboardSummary = Base &
  (
    | {
        role: "customer";
        payments: { needAction: number; waitingVerification: number };
        vendorsBooked: number;
        budget: Omit<BudgetSummary, "items" | "byCategory" | "overBudget">;
        tasks: { total: number; completed: number; skipped: number; progressPercent: number };
      }
    | {
        role: "vendor";
        products: { total: number; active: number };
        paymentsToVerify: number;
        revenue: { thisMonth: number; total: number };
        rating: { average: number; count: number };
      }
    | {
        role: "admin";
        users: { total: number; customers: number };
        vendors: { total: number; pendingVerification: number; verified: number };
        paymentsPending: number;
        openDisputes: number;
        revenue: number;
      }
  );
export async function getDashboardSummary(role: DashboardSummary["role"]) {
  const result = await authenticatedDataRequest<DashboardSummary>(
    `/dashboard/summary?role=${role}`,
  );
  if (result.role !== role) throw new Error("Ringkasan dashboard tidak sesuai akun yang dipilih.");
  return result;
}
