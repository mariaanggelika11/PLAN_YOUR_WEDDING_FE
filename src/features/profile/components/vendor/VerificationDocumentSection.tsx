"use client";

import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { VerificationDocumentSection } from "@/features/profile/components/shared/StepSectionLayouts";
import { vendorStatusDetails } from "@/features/profile/components/vendor/VendorStatus";
import { primaryVerificationDocument } from "@/features/profile/mappers";
import type { VendorApiProfile, VendorVerificationDocument } from "@/features/profile/types";
import { PopupMessage } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput, AppSelect } from "@/shared/components/ui/FormFields";
import { Eye, FileCheck2 } from "lucide-react";
import { useState } from "react";

export function VendorVerificationDocumentSection({
  active,
  canEdit,
  profile,
}: {
  active: boolean;
  canEdit: boolean;
  profile: VendorApiProfile | null;
}) {
  const document = primaryVerificationDocument(profile);
  return (
    <VerificationDocumentSection active={active}>
      {document && <VendorDocumentSummary document={document} />}
      <fieldset className="contents" disabled={!canEdit}>
        <AppSelect
          defaultValue={document?.documentType ?? ""}
          label="Jenis dokumen"
          name="legalDocumentType"
        >
          <option value="">Pilih jenis dokumen</option>
          <option value="KTP">KTP pemilik</option>
          <option value="NIB">NIB</option>
          <option value="NPWP">NPWP</option>
          <option value="SIUP">SIUP</option>
          <option value="OTHER">Dokumen lainnya</option>
        </AppSelect>
        <AppInput
          defaultValue={document?.documentNumber ?? ""}
          label="Nomor dokumen"
          name="legalDocumentNumber"
        />
        <div className="md:col-span-2">
          <AppInput
            accept=".jpg,.jpeg,.png,.pdf"
            helper="JPG, PNG, atau PDF · Maks. 5 MB"
            label={document?.attachmentId ? "Ganti file" : "File dokumen"}
            name="legalDocumentFile"
            type="file"
          />
        </div>
      </fieldset>
    </VerificationDocumentSection>
  );
}

function VendorDocumentSummary({ document }: { document: VendorVerificationDocument }) {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState("");
  const status = vendorStatusDetails(document.status);
  async function openDocument() {
    if (!document.attachmentId) return;
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setError("Preview diblokir browser. Izinkan pop-up untuk melihat dokumen.");
      return;
    }
    previewWindow.opener = null;
    previewWindow.document.title = "Memuat dokumen...";
    previewWindow.document.body.textContent = "Dokumen sedang dimuat...";
    setIsOpening(true);
    setError("");
    try {
      const blob = await getAttachmentBlob(document.attachmentId);
      const url = URL.createObjectURL(blob);
      previewWindow.location.replace(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      previewWindow.close();
      setError("Dokumen gagal dibuka.");
    } finally {
      setIsOpening(false);
    }
  }
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 md:col-span-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-rose-500 shadow-sm">
          <FileCheck2 aria-hidden="true" size={20} />
        </span>
        <div className="mr-auto min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {document.documentType}
            {document.documentNumber ? ` · ${document.documentNumber}` : ""}
          </p>
          <div className="mt-1">
            <StatusBadge status={status.key} />
          </div>
        </div>
        {document.attachmentId && (
          <AppButton
            disabled={isOpening}
            onClick={() => void openDocument()}
            type="button"
            variant="secondary"
          >
            <Eye aria-hidden="true" size={17} />
            Lihat dokumen
          </AppButton>
        )}
      </div>
      {document.rejectReason && (
        <p className="mt-3 border-t pt-3 text-sm text-red-700">{document.rejectReason}</p>
      )}
      {error && <PopupMessage message={error} variant="error" />}
    </div>
  );
}
