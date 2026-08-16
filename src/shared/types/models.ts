export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";
export type VendorStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED_ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "INACTIVE";
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "DELETED" | "REJECTED";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "WAITING_VENDOR_CONFIRMATION"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER_CONFIRMATION"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED_BY_VENDOR"
  | "DISPUTED";
export type PaymentStatus =
  | "PENDING"
  | "WAITING_PAYMENT"
  | "WAITING_VERIFICATION"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REJECTED"
  | "REFUNDED";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  status: "ACTIVE" | "SUSPENDED";
}
export interface WeddingProfile {
  weddingDate: string;
  location: string;
  city: string;
  province: string;
  eventType: string;
  theme: string;
  estimatedGuests: number;
  estimatedBudget: number;
  neededCategories: string[];
}
export interface CustomerProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  address: string;
  wedding: WeddingProfile;
}
export interface VendorCategory {
  id: string;
  name: string;
  icon: string;
}
export interface Vendor {
  id: string;
  name: string;
  ownerName: string;
  description: string;
  city: string;
  categories: string[];
  rating: number;
  status: VendorStatus;
  image: string;
}
export interface Product {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  minimumDp: number;
  duration: string;
  guestCapacity: number;
  serviceArea: string;
  status: ProductStatus;
  image: string;
}
export interface Order {
  id: string;
  number: string;
  customerName: string;
  vendorName: string;
  productName: string;
  eventDate: string;
  location: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}
export interface Payment {
  id: string;
  orderNumber: string;
  customerName: string;
  vendorName: string;
  amount: number;
  status: PaymentStatus;
  uploadedAt: string;
}
export interface Review {
  id: string;
  vendorName: string;
  customerName: string;
  rating: number;
  comment: string;
  status: "VISIBLE" | "HIDDEN";
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
export interface AdminSummary {
  totalUsers: number;
  totalVendors: number;
  pendingVendors: number;
  totalProducts: number;
  totalOrders: number;
  pendingPayments: number;
  openDisputes: number;
  revenue: number;
}
export interface Dispute {
  id: string;
  reporter: string;
  reportedParty: string;
  reason: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
}
