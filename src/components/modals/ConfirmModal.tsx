"use client";
import { usePopup } from "@/components/common/Popup";

export function ConfirmModal({
  trigger,
  title,
  description,
  onConfirm,
  requireReason = false,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm?: (reason?: string) => void;
  requireReason?: boolean;
}) {
  const { confirm } = usePopup();

  async function openConfirmation() {
    const result = await confirm({
      message: description,
      requireReason,
      title,
      variant: "error",
    });
    if (result.confirmed) onConfirm?.(result.reason);
  }

  return (
    <span className="contents" onClick={() => void openConfirmation()}>
      {trigger}
    </span>
  );
}
