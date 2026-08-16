"use client";

import { getErrorMessage } from "@/shared/api/apiClient";
import { usePopup } from "@/shared/components/feedback/Popup";
import { useCallback, useState } from "react";

interface DeleteOptions {
  action?: () => Promise<unknown>;
  confirmMessage: string;
  confirmTitle: string;
  errorMessage: string;
  onDeleted: () => void;
}

export function useProfileCollectionDelete() {
  const popup = usePopup();
  const [deleting, setDeleting] = useState(false);

  const remove = useCallback(
    async ({ action, confirmMessage, confirmTitle, errorMessage, onDeleted }: DeleteOptions) => {
      if (action) {
        const result = await popup.confirm({
          confirmLabel: "Hapus",
          message: confirmMessage,
          title: confirmTitle,
          variant: "error",
        });
        if (!result.confirmed) return false;
      }

      setDeleting(true);
      try {
        await action?.();
        onDeleted();
        return true;
      } catch (error) {
        popup.error(getErrorMessage(error, errorMessage));
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [popup],
  );

  return { deleting, remove };
}
