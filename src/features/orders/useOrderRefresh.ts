"use client";
import { useEffect, useRef } from "react";

/** Refresh visible order views without overlapping requests or interrupting mutations. */
export function useOrderRefresh(
  reload: (options?: { background?: boolean }) => Promise<unknown>,
  paused = false,
) {
  const busy = useRef(false);
  useEffect(() => {
    if (paused) return;
    const refresh = async () => {
      if (document.visibilityState !== "visible" || busy.current) return;
      busy.current = true;
      try {
        await reload({ background: true });
      } finally {
        busy.current = false;
      }
    };
    const timer = window.setInterval(() => void refresh(), 30_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("pyw-order-refresh", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pyw-order-refresh", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [reload, paused]);
}
