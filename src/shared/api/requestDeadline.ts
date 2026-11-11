export const API_TIMEOUT_MS = 30_000;
export const UPLOAD_TIMEOUT_MS = 120_000;

export class RequestTimeoutError extends Error {
  constructor() {
    super("Request deadline exceeded");
    this.name = "RequestTimeoutError";
  }
}

/** Keep the deadline active through body consumption and preserve caller cancellation. */
export async function withRequestDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  init?: RequestInit,
  timeoutMs = init?.body instanceof FormData ? UPLOAD_TIMEOUT_MS : API_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort(init?.signal?.reason);
  if (init?.signal?.aborted) cancel();
  else init?.signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new RequestTimeoutError());
  }, timeoutMs);
  try {
    controller.signal.throwIfAborted();
    return await operation(controller.signal);
  } catch (error) {
    if (
      timedOut ||
      (init?.signal?.reason instanceof DOMException && init.signal.reason.name === "TimeoutError")
    )
      throw new RequestTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener("abort", cancel);
  }
}
