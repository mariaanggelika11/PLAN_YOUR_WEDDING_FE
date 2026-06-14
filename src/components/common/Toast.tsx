"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export function ToastMessage({ message, duration = 3000 }: { message: string; duration?: number }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);
  if (!visible) return null;
  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl"
    >
      <CheckCircle2 className="shrink-0 text-emerald-600" size={19} />
      <p className="text-sm font-medium">{message}</p>
      <button aria-label="Tutup notifikasi" onClick={() => setVisible(false)}>
        <X size={16} />
      </button>
    </div>
  );
}
