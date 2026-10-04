"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePopup } from "@/shared/components/feedback/Popup";

/** Confirm in-app navigation once; browser refresh/close keeps native protection. */
export function useUnsavedChanges() {
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const pending = useRef(false);
  const router = useRouter();
  const { confirm } = usePopup();
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
  }, []);
  const markSaved = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
  }, []);

  useEffect(() => {
    let active = true;
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function onClick(event: MouseEvent) {
      if (
        !dirtyRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (
        !anchor ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      )
        return;
      const destination = new URL(anchor.href, location.href);
      if (!["http:", "https:"].includes(destination.protocol)) return;
      if (
        destination.origin === location.origin &&
        destination.pathname === location.pathname &&
        destination.search === location.search
      )
        return;
      // Stop Next's original link handler, then navigate explicitly after confirmation.
      event.preventDefault();
      event.stopPropagation();
      if (pending.current) return;
      pending.current = true;
      void confirm({
        title: "Perubahan belum disimpan",
        message: "Jika keluar sekarang, perubahan yang belum disimpan akan hilang.",
        variant: "warning",
        cancelLabel: "Tetap di halaman",
        confirmLabel: "Keluar tanpa menyimpan",
      })
        .then((result) => {
          if (!active || !result.confirmed) return;
          markSaved();
          if (destination.origin === location.origin) {
            router.push(destination.pathname + destination.search + destination.hash);
          } else {
            window.location.assign(destination.href);
          }
        })
        .finally(() => {
          pending.current = false;
        });
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      active = false;
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [confirm, markSaved, router]);
  return { dirty, markDirty, markSaved };
}
