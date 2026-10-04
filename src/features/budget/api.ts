import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
export interface BudgetSummary {
  budgetSet: boolean;
  totalBudget: number;
  committedAmount: number;
  verifiedPayments: number;
  remainingBudget: number;
  outstandingBills: number;
  overBudget: boolean;
  items: Array<{
    orderId: string;
    orderNumber: string;
    category: string;
    productName: string;
    vendorName: string;
    status: string;
    eventDate: string;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
  }>;
  byCategory: Array<{
    category: string;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    orderCount: number;
  }>;
}
export const getBudgetSummary = () => authenticatedDataRequest<BudgetSummary>("/budget/summary");
