import type { NotificationQuery } from "./types.ts";
export function notificationQuery(query: NotificationQuery) {
  const params = new URLSearchParams({
    pageNumber: String(query.pageNumber),
    pageSize: String(query.pageSize),
  });
  if (query.isRead !== undefined) params.set("isRead", String(query.isRead));
  return params.toString();
}
/** Only navigate inside the authenticated role area; reject external and encoded redirects. */
export function notificationDestination(value: string | null, role: string): string | null {
  if (!value || !["customer", "vendor", "admin"].includes(role)) return null;
  if (/[\\\s\u0000-\u001f]/.test(value) || !value.startsWith(`/${role}/`)) return null;
  try {
    const decoded = decodeURIComponent(value.split(/[?#]/)[0]);
    if (
      decoded.includes("\\") ||
      decoded.split("/").some((segment) => segment === ".." || segment === ".")
    )
      return null;
    const url = new URL(value, "https://app.invalid");
    return url.origin === "https://app.invalid" && url.pathname.startsWith(`/${role}/`)
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
}
