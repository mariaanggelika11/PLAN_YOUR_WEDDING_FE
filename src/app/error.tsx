"use client";

import { useEffect } from "react";
import { captureFrontendError } from "@/shared/monitoring/client";
import { ErrorScreen } from "@/shared/components/feedback/ErrorScreen";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => captureFrontendError(error), [error]);
  return <ErrorScreen reset={reset} digest={error.digest} />;
}
