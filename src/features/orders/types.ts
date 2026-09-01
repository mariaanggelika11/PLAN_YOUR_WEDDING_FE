import type { OrderStatus, PaymentStatus } from "@/shared/types/models";

export type OrderPaymentType = "DP" | "FULL";
export type OrderPaymentInstallment = OrderPaymentType | "REMAINING";

export interface OrderPayment {
  id: string;
  order?: { id: string; orderNumber: string };
  installment: OrderPaymentInstallment;
  amount: number;
  bankAccount?: { id: string } | null;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  status: PaymentStatus;
  rejectReason: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  verifiedBy?: string | null;
  proofAttachmentId: string | null;
  active?: boolean;
  createdAt?: string;
  modifiedAt?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: { id: number; fullName: string };
  vendor: { id: number; businessName: string };
  vendorProduct: { id: string; name: string };
  productName: string;
  productPrice: number;
  productMinimumDp: number | null;
  eventDate: string;
  eventLocation: string;
  guestCount: number | null;
  notes: string | null;
  paymentType: OrderPaymentType;
  totalAmount: number;
  status: OrderStatus;
  rejectReason: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  payments?: OrderPayment[];
  active: boolean;
  createdAt: string;
  modifiedAt?: string | null;
}

export interface OrderPage { data: Order[]; total: number; pageNumber: number; pageSize: number }
export interface OrderQuery { filter?: string; status?: OrderStatus; pageNumber?: number; pageSize?: number }
export interface CreateOrderPayload {
  vendorProductId: number;
  eventDate: string;
  eventLocation: string;
  guestCount?: number;
  notes?: string;
  paymentType: OrderPaymentType;
}
