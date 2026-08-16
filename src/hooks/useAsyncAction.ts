"use client";

import { useCallback, useRef, useState } from "react";

interface AsyncActionOptions {
  errorMessage?: string | ((error: unknown) => string);
  successMessage?: string;
}

export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const actionId = useRef(0);

  const clearFeedback = useCallback(() => {
    setError("");
    setMessage("");
  }, []);

  const run = useCallback(
    async <T>(action: () => Promise<T>, options: AsyncActionOptions = {}) => {
      const currentAction = ++actionId.current;
      setLoading(true);
      clearFeedback();
      try {
        const data = await action();
        if (currentAction === actionId.current) setMessage(options.successMessage ?? "");
        return { data, success: true as const };
      } catch (actionError) {
        if (currentAction === actionId.current) {
          setError(resolveErrorMessage(actionError, options.errorMessage));
        }
        return { error: actionError, success: false as const };
      } finally {
        if (currentAction === actionId.current) setLoading(false);
      }
    },
    [clearFeedback],
  );

  return { clearFeedback, error, loading, message, run, setError, setMessage };
}

function resolveErrorMessage(error: unknown, errorMessage?: string | ((error: unknown) => string)) {
  if (typeof errorMessage === "function") return errorMessage(error);
  if (errorMessage) return errorMessage;
  return error instanceof Error ? error.message : "Permintaan gagal diproses.";
}
