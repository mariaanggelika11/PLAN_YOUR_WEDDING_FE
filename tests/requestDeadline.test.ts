import assert from "node:assert/strict";
import test from "node:test";
import { RequestTimeoutError, withRequestDeadline } from "../src/shared/api/requestDeadline.ts";
import { apiRequest } from "../src/shared/api/apiClient.ts";

function waitForAbort(signal: AbortSignal) {
  return new Promise<never>((_, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

test("request deadlines stop stalled work without retrying it", async () => {
  let calls = 0;
  await assert.rejects(
    withRequestDeadline(
      (signal) => {
        calls++;
        return waitForAbort(signal);
      },
      undefined,
      10,
    ),
    RequestTimeoutError,
  );
  assert.equal(calls, 1);
});

test("caller cancellation and pre-cancelled requests are preserved", async () => {
  const controller = new AbortController();
  const reason = new Error("page left");
  const request = withRequestDeadline((signal) => waitForAbort(signal), {
    signal: controller.signal,
  });
  controller.abort(reason);
  await assert.rejects(request, (error) => error === reason);
  let called = false;
  await assert.rejects(
    withRequestDeadline(
      async () => {
        called = true;
      },
      { signal: controller.signal },
    ),
  );
  assert.equal(called, false);
});

test("deadline covers response body consumption, not only response headers", async () => {
  await assert.rejects(
    withRequestDeadline(
      async (signal) => {
        await Promise.resolve(); // Response headers arrived.
        return waitForAbort(signal); // Response body is stalled.
      },
      undefined,
      10,
    ),
    RequestTimeoutError,
  );
});

test("API requests preserve payloads and never retry failed mutations", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(
      JSON.stringify({ message: "Rejected", code: "INVALID_STATUS_TRANSITION" }),
      { status: 409 },
    );
  };
  try {
    await assert.rejects(
      apiRequest("/orders/1/complete", { method: "POST" }),
      (error: unknown) =>
        error instanceof Error &&
        "status" in error &&
        error.status === 409 &&
        "payload" in error &&
        (error.payload as { code: string }).code === "INVALID_STATUS_TRANSITION",
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test("caller supplied timeout signals are reported as timeouts, not user cancellation", async () => {
  await assert.rejects(
    withRequestDeadline(waitForAbort, { signal: AbortSignal.timeout(10) }),
    RequestTimeoutError,
  );
});
