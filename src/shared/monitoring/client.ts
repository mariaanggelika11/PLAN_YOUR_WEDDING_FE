import { monitoringOptions } from "./options.ts";

type SDK = typeof import("@sentry/nextjs");
let pending: Promise<SDK> | undefined;
let active: SDK | undefined;

function loadSDK() {
  if (!pending)
    pending = import("@sentry/nextjs")
      .then((sdk) => {
        sdk.init(monitoringOptions(process.env.NEXT_PUBLIC_SENTRY_DSN!));
        active = sdk;
        return sdk;
      })
      .catch((error: unknown) => {
        pending = undefined;
        throw error;
      });
  return pending;
}

export function captureFrontendError(error: unknown) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  void loadSDK()
    .then((sdk) =>
      sdk.withScope((scope) => {
        scope.setTag("surface", "react-boundary");
        sdk.captureException(error);
      }),
    )
    .catch(() => {
      /* Reporting must never prevent the UI from recovering. */
    });
}

export function initializeClientMonitoring() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  // Buffer early failures while the optional SDK loads, then let its global handlers take over.
  const early: unknown[] = [];
  const queue = (error: unknown) => {
    if (early.length < 10) early.push(error);
  };
  const onError = (event: ErrorEvent) => queue(event.error ?? new Error("Window error"));
  const onRejection = (event: PromiseRejectionEvent) => queue(event.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  void loadSDK()
    .then((sdk) => {
      early.forEach((error) => sdk.captureException(error));
    })
    .catch(() => {
      // No persistent queue or user data is stored if the monitoring service cannot load.
    })
    .finally(() => {
      early.length = 0;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    });
}

export function onRouterTransitionStart(...args: Parameters<SDK["captureRouterTransitionStart"]>) {
  active?.captureRouterTransitionStart(...args);
}

const lastApiReports = new Map<string, number>();
/** Report availability failures, not expected validation/auth/conflict responses or request bodies. */
export function captureApiFailure(status: number, code?: string) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN || typeof window === "undefined") return;
  if (!(status >= 500 || (status === 0 && code !== "REQUEST_ABORTED"))) return;
  const category =
    code === "REQUEST_TIMEOUT"
      ? "REQUEST_TIMEOUT"
      : status === 0
        ? "NETWORK_ERROR"
        : "SERVER_ERROR";
  const key = `${category}:${status}`;
  const now = Date.now();
  if (now - (lastApiReports.get(key) ?? 0) < 60_000) return;
  lastApiReports.set(key, now);
  void loadSDK()
    .then((sdk) =>
      sdk.withScope((scope) => {
        scope.setTag("surface", "api");
        scope.setTag("failure", category);
        scope.setTag("http_status", status);
        sdk.captureException(new Error("API availability failure"));
      }),
    )
    .catch(() => {
      /* Keep the original API error handling independent of monitoring. */
    });
}
