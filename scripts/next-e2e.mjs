import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// Isolate build artifacts from a running development server; never fall through to production APIs.
const monitoring = process.argv.includes("--monitoring");
const arguments_ = process.argv.slice(2).filter((argument) => argument !== "--monitoring");
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), ...arguments_], {
  stdio: "inherit",
  env: {
    ...process.env,
    PYW_E2E: "1",
    PYW_MONITORING_TEST: monitoring ? "1" : "0",
    NEXT_PUBLIC_SENTRY_DSN: monitoring ? "https://public@monitoring.invalid/1" : "",
    SENTRY_DSN: "",
    SENTRY_AUTH_TOKEN: "",
    SENTRY_ORG: "",
    SENTRY_PROJECT: "",
    SENTRY_UPLOAD_SOURCEMAPS: "false",
    BACKEND_API_URL: "http://127.0.0.1:9",
    NEXT_PUBLIC_API_URL: "/backend-api",
  },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
