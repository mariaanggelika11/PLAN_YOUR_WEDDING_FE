export const MAX_PROFILE_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VERIFICATION_DOCUMENT_TYPES = [...PROFILE_IMAGE_TYPES, "application/pdf"] as const;

export function validateAttachment(
  file: File | null,
  {
    allowedTypes,
    formatMessage,
    maxSize = MAX_PROFILE_ATTACHMENT_SIZE,
    sizeMessage,
  }: {
    allowedTypes: readonly string[];
    formatMessage: string;
    maxSize?: number;
    sizeMessage: string;
  },
) {
  if (!file) return "";
  if (file.size > maxSize) return sizeMessage;
  if (!allowedTypes.includes(file.type)) return formatMessage;
  return "";
}
