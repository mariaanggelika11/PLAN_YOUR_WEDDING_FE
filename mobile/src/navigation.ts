import { useRouter } from "expo-router";
import type { Role } from "./domain/contracts";
export type Kind =
  | "dashboard"
  | "marketplace"
  | "product"
  | "store"
  | "checkout"
  | "orders"
  | "order"
  | "messages"
  | "review"
  | "profile"
  | "budget"
  | "planning"
  | "task"
  | "planning-settings"
  | "notifications"
  | "products"
  | "product-edit"
  | "users"
  | "vendors"
  | "vendor-verification"
  | "vendor-detail"
  | "payments"
  | "payment"
  | "reviews"
  | "disputes"
  | "parameters"
  | "parameter"
  | "terms"
  | "terms-edit"
  | "reports"
  | "audit"
  | "more";
export interface PageParams {
  kind: Kind;
  id?: string;
}
export type StackParams = { Main: undefined; Page: PageParams };
export const titles: Record<Kind, string> = {
  dashboard: "Dashboard",
  marketplace: "Marketplace",
  product: "Package",
  store: "Vendor",
  checkout: "Create order",
  orders: "Orders",
  order: "Order summary",
  messages: "Conversation",
  review: "Write a review",
  profile: "Profile",
  budget: "Budget",
  planning: "Wedding preparation",
  task: "Edit task",
  "planning-settings": "Planning settings",
  notifications: "Notifications",
  products: "Products",
  "product-edit": "Edit package",
  users: "Users",
  vendors: "Vendors",
  "vendor-verification": "Vendor verification",
  "vendor-detail": "Vendor verification",
  payments: "Payment verification",
  payment: "Payment verification",
  reviews: "Reviews",
  disputes: "Disputes",
  parameters: "Parameters",
  parameter: "Edit parameter",
  terms: "Terms and conditions",
  "terms-edit": "Create terms version",
  reports: "Reports",
  audit: "Audit logs",
  more: "More",
};
const common: Kind[] = ["dashboard", "orders", "order", "messages", "profile", "more"];
const allowed: Record<Role, Kind[]> = {
  CUSTOMER: [
    ...common,
    "marketplace",
    "product",
    "store",
    "checkout",
    "review",
    "budget",
    "planning",
    "task",
    "planning-settings",
    "notifications",
  ],
  VENDOR: [
    ...common,
    "marketplace",
    "product",
    "store",
    "products",
    "product-edit",
    "notifications",
    "payment",
    "payments",
    "reviews",
  ],
  ADMIN: [
    ...common,
    "products",
    "product",
    "users",
    "vendors",
    "vendor-verification",
    "vendor-detail",
    "payments",
    "payment",
    "reviews",
    "disputes",
    "parameters",
    "parameter",
    "terms",
    "terms-edit",
    "reports",
    "audit",
  ],
};
export function canVisit(role: Role, kind: Kind) {
  return allowed[role].includes(kind);
}
export function useGo() {
  const router = useRouter();
  return (kind: Kind, id?: string) =>
    router.push({ pathname: "/page", params: { kind, ...(id ? { id } : {}) } });
}
export const menu: Record<Role, Kind[]> = {
  CUSTOMER: ["profile", "marketplace", "orders", "planning", "budget", "notifications"],
  VENDOR: ["profile", "products", "orders", "payments", "marketplace", "reviews", "notifications"],
  ADMIN: [
    "profile",
    "users",
    "vendors",
    "vendor-verification",
    "payments",
    "products",
    "orders",
    "reviews",
    "disputes",
    "parameters",
    "terms",
    "reports",
    "audit",
  ],
};
