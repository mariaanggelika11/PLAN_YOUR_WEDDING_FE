import type { Session } from "../domain/contracts";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
export interface ApiOptions {
  baseUrl: string;
  getSession: () => Session | null;
  onUnauthorized: (token?: string) => void;
  fetcher?: typeof fetch;
  timeout?: number;
}
/** Native requests go to the backend directly; Next.js rewrites are not available on Android. */
export function createApi(options: ApiOptions) {
  const base = new URL(options.baseUrl);
  if (
    base.protocol !== "https:" &&
    !(base.protocol === "http:" && ["localhost", "127.0.0.1", "10.0.2.2"].includes(base.hostname))
  )
    throw new Error("HTTPS_REQUIRED");
  const fetcher = options.fetcher ?? fetch;
  return async function request<T>(
    path: string,
    init: RequestInit = {},
    authenticated = true,
  ): Promise<T> {
    if (init.signal?.aborted) throw new ApiError(0, "REQUEST_ABORTED");
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
      throw new Error("INVALID_ENDPOINT");
    const url = new URL(`${base.pathname.replace(/\/$/, "")}${path}`, base.origin);
    if (url.origin !== base.origin) throw new Error("INVALID_ENDPOINT");
    const session = options.getSession();
    if (authenticated && !session) throw new ApiError(401, "SESSION_EXPIRED");
    if (authenticated && session?.expiresAt && session.expiresAt <= Date.now()) {
      options.onUnauthorized(session.accessToken);
      throw new ApiError(401, "SESSION_EXPIRED");
    }
    const controller = new AbortController();
    let timedOut = false;
    const deadline = setTimeout(
      () => {
        timedOut = true;
        controller.abort();
      },
      options.timeout ?? (init.body instanceof FormData ? 120_000 : 30_000),
    );
    const abort = () => controller.abort();
    if (init.signal?.aborted) abort();
    else init.signal?.addEventListener("abort", abort, { once: true });
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body && !(init.body instanceof FormData))
      headers.set("Content-Type", "application/json");
    if (authenticated && session) headers.set("Authorization", `Bearer ${session.accessToken}`);
    try {
      const response = await fetcher(url.toString(), {
        ...init,
        headers,
        signal: controller.signal,
        redirect: "error",
      });
      const text = await response.text();
      let result: { data?: T; code?: string; errorCode?: string } | undefined;
      try {
        result = text ? JSON.parse(text) : undefined;
      } catch {
        if (response.ok) throw new ApiError(response.status, "INVALID_RESPONSE");
      }
      if (!response.ok) {
        if (response.status === 401 && authenticated) options.onUnauthorized(session?.accessToken);
        const known = [
          "TERMS_OUTDATED",
          "TERMS_ACCEPTANCE_REQUIRED",
          "EMAIL_NOT_VERIFIED",
          "ORDER_STATE_CONFLICT",
        ];
        const code = result?.code ?? result?.errorCode;
        throw new ApiError(
          response.status,
          code && known.includes(code)
            ? code
            : response.status === 401
              ? "SESSION_EXPIRED"
              : response.status === 403
                ? "FORBIDDEN"
                : response.status === 409
                  ? "CONFLICT"
                  : "REQUEST_FAILED",
        );
      }
      if (response.status === 204) return undefined as T;
      if (!result || !Object.hasOwn(result, "data"))
        throw new ApiError(response.status, "INVALID_RESPONSE");
      return result.data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        timedOut ? "REQUEST_TIMEOUT" : init.signal?.aborted ? "REQUEST_ABORTED" : "NETWORK_ERROR",
      );
    } finally {
      clearTimeout(deadline);
      init.signal?.removeEventListener("abort", abort);
    }
  };
}
export type Api = ReturnType<typeof createApi>;
export const jsonBody = (data: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(data),
});
export function query(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return `?${params}`;
}
