import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: /monitoring\.spec\.ts$/,
  testIgnore: [],
  projects: base.projects?.filter((project) => project.name === "desktop-chromium"),
  webServer: {
    command: "node scripts/next-e2e.mjs --monitoring start --hostname 127.0.0.1 --port 3107",
    url: "http://127.0.0.1:3107",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
