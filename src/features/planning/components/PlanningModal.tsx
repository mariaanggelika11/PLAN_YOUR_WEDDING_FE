"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const BusyContext = createContext<(busy: boolean) => void>(() => {});
export function usePlanningModalBusy(busy: boolean) {
  const setBusy = useContext(BusyContext);
  useEffect(() => {
    setBusy(busy);
    return () => setBusy(false);
  }, [busy, setBusy]);
}

export function PlanningModal({
  title,
  description,
  onClose,
  children,
  dismissible = true,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <BusyContext.Provider value={setBusy}>
      <Dialog.Root
        open
        onOpenChange={(open) => {
          if (!open && !busy && dismissible) onClose();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm" />
          <Dialog.Content
            onEscapeKeyDown={(event) => {
              if (busy || !dismissible) event.preventDefault();
            }}
            onInteractOutside={(event) => {
              if (busy || !dismissible) event.preventDefault();
            }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-overlay sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-7"
          >
            <div className="mb-6 border-b pb-5 pr-9">
              <Dialog.Title className="text-xl font-semibold text-ink">{title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-stone-500">
                {description}
              </Dialog.Description>
            </div>
            {dismissible && (
              <Dialog.Close
                disabled={busy}
                aria-label="Tutup"
                className="absolute right-4 top-4 rounded-full p-2 text-stone-500 hover:bg-stone-100"
              >
                <X size={20} />
              </Dialog.Close>
            )}
            {children}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </BusyContext.Provider>
  );
}
