import { sanitizeMonitoringEvent } from "./privacy.ts";

export function monitoringOptions(dsn: string) {
  return {
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "production",
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    sendDefaultPii: false,
    autoSessionTracking: false,
    sendClientReports: false,
    enableLogs: false,
    maxBreadcrumbs: 0,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend: sanitizeMonitoringEvent,
  };
}
