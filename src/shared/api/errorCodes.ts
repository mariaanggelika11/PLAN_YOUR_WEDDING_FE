/** Stable backend codes; message text must never control application behavior. */
export function apiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return;
  const body = "payload" in error ? error.payload : error;
  if (body && typeof body === "object" && "code" in body && typeof body.code === "string")
    return body.code;
}
export function shouldReloadResource(error: unknown) {
  return [
    "ORDER_ALREADY_PROCESSED",
    "PAYMENT_ALREADY_PROCESSED",
    "INVALID_STATUS_TRANSITION",
    "DUPLICATE_REVIEW",
  ].includes(apiErrorCode(error) ?? "");
}
export function apiErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return;
  if ("status" in error && typeof error.status === "number") return error.status;
  if ("statusCode" in error && typeof error.statusCode === "number") return error.statusCode;
}
export function isForbiddenResource(error: unknown) {
  return (
    apiErrorStatus(error) === 403 ||
    ["FORBIDDEN_RESOURCE", "ADMIN_ONLY"].includes(apiErrorCode(error) ?? "")
  );
}
