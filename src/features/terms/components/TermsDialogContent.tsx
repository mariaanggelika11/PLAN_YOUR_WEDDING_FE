"use client";

import { TermsDocumentView } from "@/features/terms/components/TermsDocumentView";
import type { TermsBlock } from "@/features/terms/types";
import { formatDate } from "@/shared/utils/formatDate";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface TermsDialogDocument {
  title: string;
  version: string;
  effectiveAt?: string;
  content: TermsBlock[];
}

/**
 * Full-screen (mobile) / centered (desktop) terms reader. Must be rendered inside a
 * Dialog.Root. `dismissible={false}` hides the close button and blocks Esc/outside clicks,
 * for flows where the user has to make an explicit choice in the footer.
 */
export function TermsDialogContent({
  document,
  idPrefix,
  description,
  footer,
  dismissible = true,
}: {
  document: TermsDialogDocument;
  idPrefix: string;
  description: string;
  footer: ReactNode;
  dismissible?: boolean;
}) {
  const block = (event: Event) => {
    if (!dismissible) event.preventDefault();
  };
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm" />
      <Dialog.Content
        onEscapeKeyDown={block}
        onPointerDownOutside={block}
        onInteractOutside={block}
        className="fixed inset-3 z-[101] flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[90dvh] sm:w-[calc(100%_-_3rem)] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2"
      >
        <header className="relative shrink-0 border-b px-5 py-5 pr-16 sm:px-8 sm:pr-16">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blush">
            Plan Your Wedding
          </p>
          <Dialog.Title className="text-lg font-semibold leading-snug text-ink sm:text-2xl">
            {document.title}
          </Dialog.Title>
          <p className="mt-1 text-xs text-stone-500">
            Versi {document.version}
            {document.effectiveAt && ` · berlaku sejak ${formatDate(document.effectiveAt)}`}
          </p>
          <Dialog.Description className="mt-2 text-sm leading-6 text-stone-500">
            {description}
          </Dialog.Description>
          {dismissible && (
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup syarat dan ketentuan"
                className="absolute right-3 top-4 grid size-11 place-items-center rounded-full text-stone-500 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blush sm:right-5"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          )}
        </header>
        <div
          className="min-h-0 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8"
          tabIndex={0}
          role="region"
          aria-label="Dokumen syarat dan ketentuan"
        >
          <TermsDocumentView blocks={document.content} idPrefix={idPrefix} />
        </div>
        <footer className="flex shrink-0 flex-col gap-3 border-t bg-stone-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {footer}
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
