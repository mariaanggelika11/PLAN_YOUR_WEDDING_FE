import { formFile, formValue } from "@/features/profile/mappers";
import {
  PROFILE_IMAGE_TYPES,
  validateAttachment,
} from "@/features/profile/validation/attachmentValidation";
import {
  controlStep,
  fieldLabel,
  invalidPopulatedControl,
  type ProfileValidationError,
} from "@/features/profile/validation/sharedValidation";

export function validateCustomerProfile(form: HTMLFormElement): ProfileValidationError | null {
  if (!formValue(form, "fullName")) {
    return { step: 0, message: "Nama lengkap wajib diisi sebelum menyimpan profile." };
  }
  const invalid = invalidPopulatedControl(form);
  if (invalid) {
    return {
      step: controlStep(invalid),
      message: `Periksa kembali field “${fieldLabel(invalid)}” sebelum menyimpan profile.`,
    };
  }
  const attachmentError = validateAttachment(formFile(form, "avatarPhoto"), {
    allowedTypes: PROFILE_IMAGE_TYPES,
    formatMessage: "Format foto profile harus JPG, PNG, atau WebP.",
    sizeMessage: "Ukuran foto profile maksimal 5 MB.",
  });
  return attachmentError ? { step: 2, message: attachmentError } : null;
}
