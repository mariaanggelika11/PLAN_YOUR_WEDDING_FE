"use client";

import { TermsDialogContent } from "@/features/terms/components/TermsDialogContent";
import type { TermsDocument } from "@/features/terms/types";
import { AppButton } from "@/shared/components/ui/AppButton";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, FileText } from "lucide-react";

/** Terms content comes from the API (GET /terms/active/:type), never from the bundle. */
export function RegistrationTerms({
  type,
  terms,
}: {
  type: "customer" | "vendor";
  terms: TermsDocument;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg text-left text-blush outline-none transition hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-blush focus-visible:ring-offset-4"
        >
          <FileText size={20} className="shrink-0" aria-hidden="true" />
          <span className="flex-1 font-semibold">
            Syarat dan ketentuan {type === "vendor" ? "mitra vendor" : "pengguna"}
          </span>
          <ArrowUpRight size={18} className="shrink-0" aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <TermsDialogContent
        document={terms}
        idPrefix={`terms-${type}`}
        description="Baca ketentuan berikut sebelum menyetujui dan melanjutkan pendaftaran."
        footer={
          <>
            <p className="max-w-md text-xs leading-5 text-stone-500">
              Persetujuan diberikan melalui checkbox pada formulir pendaftaran.
            </p>
            <Dialog.Close asChild>
              <AppButton type="button" variant="secondary">
                Kembali ke pendaftaran
              </AppButton>
            </Dialog.Close>
          </>
        }
      />
    </Dialog.Root>
  );
}
