"use client";

import { useEffect } from "react";
import { captureFrontendError } from "@/shared/monitoring/client";
import { ErrorScreen } from "@/shared/components/feedback/ErrorScreen";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => captureFrontendError(error), [error]);
  return (
    <html lang="id">
      <body>
        <ErrorScreen reset={reset} digest={error.digest} />
      </body>
    </html>
  );
}
