"use client";

import { getErrorMessage } from "@/shared/api/apiClient";
import { usePopup } from "@/shared/components/feedback/Popup";
import { useCallback, useRef, useState } from "react";

interface AsyncActionOptions {
  errorMessage?: string | ((error: unknown) => string);
  notify?: boolean;
  successMessage?: string;
}

export function useAsyncAction() {
  const popup = usePopup();
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
        if (currentAction === actionId.current) {
          const successMessage = options.successMessage ?? "";
          setMessage(successMessage);
          if (options.notify !== false && successMessage) popup.success(successMessage);
        }
        return { data, success: true as const };
      } catch (actionError) {
        if (currentAction === actionId.current) {
          const message = resolveErrorMessage(actionError, options.errorMessage);
          setError(message);
          if (options.notify !== false) popup.error(message);
        }
        return { error: actionError, success: false as const };
      } finally {
        if (currentAction === actionId.current) setLoading(false);
      }
    },
    [clearFeedback, popup],
  );

  return { clearFeedback, error, loading, message, run, setError, setMessage };
}

function resolveErrorMessage(error: unknown, errorMessage?: string | ((error: unknown) => string)) {
  if (typeof errorMessage === "function") return errorMessage(error);
  if (errorMessage) return errorMessage;
  return getErrorMessage(error, "Permintaan gagal diproses.");
}
