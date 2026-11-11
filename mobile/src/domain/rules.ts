import type { Order, OrderPayment, Role, Session } from "./contracts";

export function primaryRole(value: string | undefined): Role {
  const normalized = value
    ?.trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "ADMINISTRATOR") return "ADMIN";
  if (normalized === "ADMIN" || normalized === "VENDOR" || normalized === "CUSTOMER")
    return normalized;
  throw new Error("UNSUPPORTED_ROLE");
}
export function validSession(value: unknown, now = Date.now()): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<Session>;
  return Boolean(
    session.accessToken &&
    typeof session.accessToken === "string" &&
    session.user &&
    Number.isSafeInteger(session.user.id) &&
    session.user.id > 0 &&
    ["CUSTOMER", "VENDOR", "ADMIN"].includes(session.user.role) &&
    (session.expiresAt === undefined ||
      (Number.isFinite(session.expiresAt) && session.expiresAt > now)),
  );
}
export function canPay(order: Pick<Order, "active" | "status">) {
  return (
    order.active &&
    !["CANCELLED", "REJECTED_BY_VENDOR", "DISPUTED", "COMPLETED"].includes(order.status)
  );
}
export function orderActions(order: Pick<Order, "active" | "status">, role: Role) {
  if (!order.active) return [];
  if (role === "VENDOR") {
    if (order.status === "WAITING_VENDOR_CONFIRMATION") return ["confirm", "reject"];
    if (order.status === "CONFIRMED") return ["start"];
    if (order.status === "IN_PROGRESS") return ["deliver"];
  }
  if (role === "CUSTOMER") {
    return [
      ...(order.status === "WAITING_CUSTOMER_CONFIRMATION" ? ["complete"] : []),
      ...(["PENDING_PAYMENT", "CONFIRMED"].includes(order.status) ? ["cancel"] : []),
      ...(["CONFIRMED", "IN_PROGRESS", "WAITING_CUSTOMER_CONFIRMATION"].includes(order.status)
        ? ["dispute"]
        : []),
    ];
  }
  return role === "ADMIN" && order.status === "DISPUTED"
    ? ["resolve-completed", "resolve-cancelled"]
    : [];
}
export function canUpload(
  order: Pick<Order, "active" | "status">,
  payment: Pick<OrderPayment, "status">,
) {
  return canPay(order) && ["WAITING_PAYMENT", "REJECTED"].includes(payment.status);
}
export function validateFile(
  file: { size?: number; mimeType?: string; name: string },
  imagesOnly = false,
) {
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error("FILE_SIZE");
  const accepted = imagesOnly
    ? ["image/jpeg", "image/png"]
    : ["image/jpeg", "image/png", "application/pdf"];
  if (!accepted.includes(file.mimeType ?? "")) throw new Error("FILE_TYPE");
}
export const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export function positiveId(value: string | number) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error("INVALID_ID");
  return number;
}
