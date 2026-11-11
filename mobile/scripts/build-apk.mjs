import { spawn } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const studioJava = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(homedir(), "Library/Android/sdk");
const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  JAVA_HOME: process.env.JAVA_HOME || (existsSync(studioJava) ? studioJava : undefined),
  CI: "1",
};
async function run(command, args, cwd = root) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)),
    );
  });
}
await run(process.execPath, [
  path.join(root, "node_modules/expo/bin/cli"),
  "prebuild",
  "--platform",
  "android",
  "--no-install",
]);
await run(
  process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  [
    "assembleRelease",
    "--no-daemon",
    "--max-workers=2",
    `-PreactNativeArchitectures=${process.env.PYW_ANDROID_ABIS || "arm64-v8a"}`,
  ],
  path.join(root, "android"),
);
mkdirSync(path.join(root, "artifacts"), { recursive: true });
copyFileSync(
  path.join(root, "android/app/build/outputs/apk/release/app-release.apk"),
  path.join(root, "artifacts/plan-your-wedding-preview.apk"),
);
console.log(
  "Preview APK: artifacts/plan-your-wedding-preview.apk (local debug signing key; not a Play Store release)",
);
