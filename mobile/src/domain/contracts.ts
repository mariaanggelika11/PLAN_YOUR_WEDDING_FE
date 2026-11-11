// The mobile app consumes the same backend contracts as the existing website.
export type { Order, OrderPayment, CreateOrderPayload } from "../../../src/features/orders/types";
export type { VendorProduct } from "../../../src/features/products/types";
export type { CustomerApiProfile, VendorApiProfile } from "../../../src/features/profile/types";
export type { TermsDocument, TermsStatus } from "../../../src/features/terms/types";
export type { ApiWeddingTask, WeddingTaskPayload } from "../../../src/features/planning/types";
export type { AppNotification } from "../../../src/features/notifications/types";
export type { SystemParameter } from "../../../src/features/parameters/types";

export type Role = "CUSTOMER" | "VENDOR" | "ADMIN";
export interface Session {
  accessToken: string;
  user: { id: number; name: string; email: string; role: Role };
  expiresAt?: number;
}
export interface Page<T> {
  data: T[];
  total: number;
  pageNumber: number;
  pageSize: number;
}
export interface Dashboard {
  role: "customer" | "vendor" | "admin";
  orders: { total: number; active?: number; completed?: number };
  recentOrders: import("../../../src/features/orders/types").Order[];
  vendorsBooked?: number;
  tasks?: { progressPercent: number };
  products?: { total: number; active: number };
  revenue?: { thisMonth: number; total: number } | number;
  users?: { total: number };
  vendors?: { total: number; pendingVerification: number };
  paymentsPending?: number;
  paymentsToVerify?: number;
  openDisputes?: number;
}
export interface Budget {
  totalBudget: number;
  committedAmount: number;
  verifiedPayments: number;
  remainingBudget: number;
  outstandingBills: number;
  overBudget: boolean;
  items: {
    orderId: string;
    orderNumber: string;
    productName: string;
    vendorName: string;
    totalAmount: number;
    paidAmount: number;
  }[];
}
export interface Account {
  id: number;
  fullname: string;
  email: string;
  phoneNumber?: string;
  active: boolean;
}
export interface Message {
  id: string;
  message: string;
  isMine: boolean;
  sender: { fullname: string };
  createdAt: string;
  imageAttachmentIds?: string[];
}
