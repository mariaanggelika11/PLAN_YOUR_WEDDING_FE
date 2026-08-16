import {
  VENDOR_CONTACT_OPTIONS,
  formFile,
  formValue,
  formValues,
} from "@/features/profile/mappers";
import type { VendorApiProfile } from "@/features/profile/types";
import {
  PROFILE_IMAGE_TYPES,
  VERIFICATION_DOCUMENT_TYPES,
  validateAttachment,
} from "@/features/profile/validation/attachmentValidation";
import {
  controlStep,
  fieldLabel,
  invalidPopulatedControl,
  type ProfileValidationError,
} from "@/features/profile/validation/sharedValidation";

export function validateVendorDraft(form: HTMLFormElement): ProfileValidationError | null {
  const invalid = invalidPopulatedControl(form);
  if (invalid) {
    return {
      step: controlStep(invalid),
      message: `Periksa kembali field “${fieldLabel(invalid)}” sebelum menyimpan draft.`,
    };
  }
  const logoError = validateAttachment(formFile(form, "logoFile"), {
    allowedTypes: PROFILE_IMAGE_TYPES,
    formatMessage: "Format logo harus JPG, PNG, atau WebP.",
    sizeMessage: "Ukuran logo bisnis maksimal 5 MB.",
  });
  if (logoError) return { step: 1, message: logoError };

  const documentError = validateAttachment(formFile(form, "legalDocumentFile"), {
    allowedTypes: VERIFICATION_DOCUMENT_TYPES,
    formatMessage: "Format dokumen harus JPG, PNG, WebP, atau PDF.",
    sizeMessage: "Ukuran dokumen verifikasi maksimal 5 MB.",
  });
  if (documentError) return { step: 3, message: documentError };

  const bankValues = ["bankName", "bankAccountNumber", "bankAccountHolder"].filter((name) =>
    formValue(form, name),
  );
  if (bankValues.length > 0 && bankValues.length < 3) {
    return { step: 2, message: "Lengkapi nama bank, nomor rekening, dan nama pemilik rekening." };
  }
  if (
    (formValue(form, "legalDocumentNumber") || formFile(form, "legalDocumentFile")) &&
    !formValue(form, "legalDocumentType")
  ) {
    return { step: 3, message: "Pilih jenis dokumen untuk data dokumen yang ingin disimpan." };
  }
  return null;
}

export function validateVendorSubmission(
  form: HTMLFormElement,
  profile: VendorApiProfile | null,
): ProfileValidationError | null {
  const draftError = validateVendorDraft(form);
  if (draftError) return draftError;
  const requirements = [
    { step: 0, label: "nama pemilik", valid: Boolean(formValue(form, "ownerName")) },
    { step: 1, label: "nama bisnis", valid: Boolean(formValue(form, "businessName")) },
    { step: 1, label: "email bisnis", valid: Boolean(formValue(form, "businessEmail")) },
    { step: 1, label: "nomor telepon bisnis", valid: Boolean(formValue(form, "businessPhone")) },
    { step: 1, label: "provinsi", valid: Boolean(formValue(form, "province")) },
    { step: 1, label: "kota/kabupaten", valid: Boolean(formValue(form, "city")) },
    { step: 1, label: "alamat bisnis", valid: Boolean(formValue(form, "businessAddress")) },
    { step: 1, label: "area layanan", valid: Boolean(formValue(form, "serviceArea")) },
    { step: 1, label: "minimal satu kategori", valid: formValues(form, "categories").length > 0 },
    {
      step: 2,
      label: "minimal satu kontak bisnis",
      valid: VENDOR_CONTACT_OPTIONS.some(({ field }) => Boolean(formValue(form, field))),
    },
    {
      step: 3,
      label: "jenis dokumen verifikasi",
      valid: Boolean(formValue(form, "legalDocumentType")),
    },
    {
      step: 3,
      label: "file dokumen verifikasi",
      valid: Boolean(
        formFile(form, "legalDocumentFile") ||
        profile?.verificationDocuments?.some((document) => document.attachmentId),
      ),
    },
  ];
  const missing = requirements.filter((item) => !item.valid);
  if (!missing.length) return null;
  return {
    step: Math.min(...missing.map((item) => item.step)),
    message: `Profile belum dapat dikirim. Lengkapi: ${missing.map((item) => item.label).join(", ")}.`,
  };
}
