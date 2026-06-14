"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextarea } from "@/components/ui/FormFields";

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
  onConfirm?: () => void;
  requireReason?: boolean;
}) {
  const [reason, setReason] = useState("");
  // TODO API: Kirim alasan penolakan ke backend
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(90vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-soft">
          <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-stone-600">
            {description}
          </Dialog.Description>
          {requireReason && (
            <div className="mt-5">
              <AppTextarea
                label="Alasan"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                error={!reason ? "Alasan wajib diisi." : undefined}
                required
              />
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <AppButton variant="secondary">Batal</AppButton>
            </Dialog.Close>
            <Dialog.Close asChild>
              <AppButton
                variant="danger"
                disabled={requireReason && !reason.trim()}
                onClick={onConfirm}
              >
                Konfirmasi
              </AppButton>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
