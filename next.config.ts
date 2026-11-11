import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

const nextConfig: NextConfig = {
  distDir:
    process.env.PYW_E2E === "1"
      ? process.env.PYW_MONITORING_TEST === "1"
        ? ".next-e2e-monitoring"
        : ".next-e2e"
      : ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_API_URL ?? "https://api-planyourwedding.bulmar.tech"
    ).replace(/\/$/, "");

    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

const localizedConfig = withNextIntl(nextConfig);
const monitoringEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN);
export default monitoringEnabled
  ? withSentryConfig(localizedConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      telemetry: false,
      silent: true,
      buildTimeInstrumentation: false,
      sourcemaps: {
        disable: !(
          process.env.SENTRY_UPLOAD_SOURCEMAPS === "true" &&
          process.env.SENTRY_AUTH_TOKEN &&
          process.env.SENTRY_ORG &&
          process.env.SENTRY_PROJECT
        ),
      },
      webpack: {
        automaticVercelMonitors: false,
        autoInstrumentServerFunctions: false,
        autoInstrumentMiddleware: false,
        autoInstrumentAppDirectory: false,
        treeshake: { removeDebugLogging: true, removeTracing: true },
      },
    })
  : localizedConfig;
