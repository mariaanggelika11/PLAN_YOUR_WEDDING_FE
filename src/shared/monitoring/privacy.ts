import type { ErrorEvent, StackFrame } from "@sentry/nextjs";

const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/register/customer",
  "/register/vendor",
  "/forgot-password",
]);
const sections = new Set([
  "dashboard",
  "profile",
  "marketplace",
  "vendors",
  "products",
  "checkout",
  "payment",
  "orders",
  "review",
  "progress",
  "budget",
  "notifications",
  "vendor-verification",
  "payment-verification",
  "users",
  "disputes",
  "reports",
  "audit-logs",
  "parameters",
  "terms",
]);

/** Only route structure is sent. Queries, fragments, account names, and resource IDs are removed. */
export function monitoringRoute(value: string | undefined) {
  let path: string;
  try {
    path = new URL(value ?? "/", "https://application.invalid").pathname;
  } catch {
    return "/[redacted]";
  }
  if (publicRoutes.has(path)) return path;
  const parts = path.split("/").filter(Boolean);
  if (!["customer", "vendor", "admin"].includes(parts[0]) || !sections.has(parts[1]))
    return "/[redacted]";
  return `/${parts[0]}/${parts[1]}${parts.length > 2 ? "/[id]" : ""}`;
}

function sourceFile(value: string | undefined) {
  if (!value) return undefined;
  const clean = value.split(/[?#]/, 1)[0];
  const index = clean.indexOf("/_next/static/");
  return index >= 0 && /^[\w./-]+$/.test(clean.slice(index))
    ? clean.slice(index)
    : "[application-source]";
}
function frame(value: StackFrame): StackFrame {
  return {
    filename: sourceFile(value.filename),
    function:
      value.function && /^[\w.$<>\[\] -]{1,120}$/.test(value.function) ? value.function : undefined,
    lineno: value.lineno,
    colno: value.colno,
    in_app: value.in_app,
  };
}

/** Construct an allowlist rather than trying to remove every possible sensitive field. */
export function sanitizeMonitoringEvent(event: ErrorEvent): ErrorEvent {
  const surface = ["browser", "react-boundary", "next-server", "api"].includes(
    String(event.tags?.surface),
  )
    ? String(event.tags?.surface)
    : "browser";
  const route = monitoringRoute(
    event.request?.url ?? (typeof window !== "undefined" ? window.location.href : undefined),
  );
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: "javascript",
    level: event.level ?? "error",
    release: event.release,
    environment: event.environment,
    message: event.exception?.values?.length ? undefined : "Application error",
    exception: event.exception
      ? {
          values: event.exception.values?.map((exception) => ({
            type: exception.type && /^[\w.]{1,80}$/.test(exception.type) ? exception.type : "Error",
            value: "Exception details omitted for privacy",
            stacktrace: exception.stacktrace
              ? { frames: exception.stacktrace.frames?.map(frame) }
              : undefined,
            mechanism: exception.mechanism
              ? { type: exception.mechanism.type, handled: exception.mechanism.handled }
              : undefined,
          })),
        }
      : undefined,
    tags: {
      surface,
      route,
      ...(surface === "api" &&
      ["REQUEST_TIMEOUT", "NETWORK_ERROR", "SERVER_ERROR"].includes(String(event.tags?.failure))
        ? { failure: String(event.tags?.failure) }
        : {}),
      ...(surface === "api" && /^([45]\d\d|0)$/.test(String(event.tags?.http_status))
        ? { http_status: String(event.tags?.http_status) }
        : {}),
    },
    request: { url: route },
    // Debug IDs connect public compiled frames to privately uploaded source maps.
    debug_meta: event.debug_meta?.images
      ? {
          images: event.debug_meta.images
            .filter((image) => /^[a-f\d-]{32,36}$/i.test(image.debug_id ?? ""))
            .map((image) => ({
              type: "sourcemap",
              code_file: sourceFile(image.code_file) ?? "[application-source]",
              debug_id: image.debug_id,
            })),
        }
      : undefined,
  };
}
