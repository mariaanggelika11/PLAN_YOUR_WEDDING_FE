"use client";
import { useEffect } from "react";
import { usePopup } from "@/components/common/Popup";

export function ToastMessage({
  message,
  duration = 4000,
  variant = "success",
}: {
  message: string;
  duration?: number;
  variant?: "success" | "warning" | "error";
}) {
  const { notify } = usePopup();

  useEffect(() => {
    notify({ duration, message, variant });
  }, [duration, message, notify, variant]);

  return null;
}
