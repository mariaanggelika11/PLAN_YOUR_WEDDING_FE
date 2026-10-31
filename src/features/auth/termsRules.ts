import type { TermsDocument } from "../terms/types.ts";

export function validateActiveTerms(value: TermsDocument, type: "customer" | "vendor") {
  if (
    !value ||
    !Number.isSafeInteger(value.id) ||
    value.id <= 0 ||
    value.termsType !== type.toUpperCase() ||
    value.isActive !== true ||
    !value.title?.trim() ||
    !Array.isArray(value.content) ||
    !value.content.length ||
    !value.content.every((block) =>
      block.kind === "paragraph"
        ? typeof block.text === "string"
        : block.kind === "table" &&
          Array.isArray(block.rows) &&
          block.rows.every(
            (row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"),
          ),
    )
  )
    throw new Error("Syarat dan ketentuan aktif belum tersedia. Silakan coba lagi.");
  return value;
}

export function registrationConsent(acceptedTerms: boolean, termsVersionId: number) {
  if (acceptedTerms !== true)
    throw new Error("Anda wajib menyetujui syarat dan ketentuan sebelum mendaftar.");
  if (!Number.isSafeInteger(termsVersionId) || termsVersionId <= 0)
    throw new Error("Versi syarat dan ketentuan tidak valid. Silakan muat ulang.");
  return { acceptedTerms, termsVersionId };
}
