import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

// Count every unique initial JS file in the root layout and route manifest.
// This is a reproducible transfer-size budget, not a measured Web Vitals score.
const dist = resolve(process.argv[2] ?? ".next-e2e");
const manifest = JSON.parse(readFileSync(resolve(dist, "app-build-manifest.json"), "utf8"));
const budgets = [
  ["/", "/page", 205],
  ["/login", "/login/page", 210],
  ["/customer", "/customer/[[...slug]]/page", 195],
  ["/vendor", "/vendor/[[...slug]]/page", 195],
  ["/admin", "/admin/[[...slug]]/page", 195],
];
let failed = false;
for (const [route, key, limit] of budgets) {
  if (!manifest.pages[key] || !manifest.pages["/layout"])
    throw new Error(`Missing build manifest entry: ${key}`);
  const files = [...new Set([...manifest.pages["/layout"], ...manifest.pages[key]])].filter(
    (file) => file.endsWith(".js"),
  );
  const kib =
    files.reduce((size, file) => size + gzipSync(readFileSync(resolve(dist, file))).byteLength, 0) /
    1024;
  const pass = kib <= limit;
  console.log(
    `${pass ? "PASS" : "FAIL"} ${route}: ${kib.toFixed(1)} KiB gzip (budget ${limit} KiB, ${files.length} initial scripts)`,
  );
  if (!pass) failed = true;
}
if (failed) process.exitCode = 1;
