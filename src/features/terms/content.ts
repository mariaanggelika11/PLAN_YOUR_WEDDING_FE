import type { TermsBlock, TermsType } from "./types.ts";

export const TERMS_TYPE_LABELS: Record<TermsType, string> = {
  CUSTOMER: "Pengguna (customer)",
  VENDOR: "Mitra vendor",
};

export const isTermsHeading = (text: string) => /^\d+\.\s|^Lampiran\s/.test(text);

/**
 * Validates an uploaded terms file before it is sent to the API. Accepts an array of blocks
 * ({ kind, text?, rows? }), the same format the API returns in `content`.
 */
export function parseTermsBlocks(raw: unknown): TermsBlock[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("File harus berisi array blok syarat dan ketentuan yang tidak kosong.");
  }
  return raw.map((block, index) => {
    const position = `Blok ke-${index + 1}`;
    if (!block || typeof block !== "object") throw new Error(`${position} tidak valid.`);
    const { kind, text, rows } = block as Record<string, unknown>;
    if (kind !== "paragraph" && kind !== "table") {
      throw new Error(`${position}: kind harus "paragraph" atau "table".`);
    }
    if (text !== undefined && typeof text !== "string") {
      throw new Error(`${position}: text harus berupa teks.`);
    }
    if (
      rows !== undefined &&
      !(
        Array.isArray(rows) &&
        rows.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"))
      )
    ) {
      throw new Error(`${position}: rows harus berupa tabel teks (array of array).`);
    }
    if (kind === "paragraph" && !text?.trim()) throw new Error(`${position}: text wajib diisi.`);
    if (kind === "table" && !(rows as string[][] | undefined)?.length) {
      throw new Error(`${position}: tabel wajib memiliki rows.`);
    }
    return {
      kind,
      ...(text !== undefined ? { text } : {}),
      ...(rows !== undefined ? { rows: rows as string[][] } : {}),
    };
  });
}
