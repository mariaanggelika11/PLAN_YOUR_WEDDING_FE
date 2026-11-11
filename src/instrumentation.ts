import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.SENTRY_DSN) await import("./sentry.server.config");
  }
}
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  // Keep the optional Node SDK out of the authentication middleware's edge bundle.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.SENTRY_DSN) return;
    const Sentry = await import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      scope.setTag("surface", "next-server");
      Sentry.captureRequestError(...args);
    });
  }
};
