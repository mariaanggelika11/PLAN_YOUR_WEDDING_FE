"use client";

import customerTerms from "@/features/auth/content/terms-customer.json";
import vendorTerms from "@/features/auth/content/terms-vendor.json";
import { AppButton } from "@/shared/components/ui/AppButton";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, FileText, X } from "lucide-react";

type TermsBlock = { kind: string; text?: string; rows?: string[][] };
const isHeading = (text: string) => /^\d+\.\s|^Lampiran\s/.test(text);

/** Presentation only: the source documents remain unchanged. */
export function RegistrationTerms({ type }: { type: "customer" | "vendor" }) {
  const blocks: TermsBlock[] = type === "vendor" ? vendorTerms : customerTerms;
  const title = blocks[0].text;
  const sectionId = (index: number) => `terms-${type}-${index}`;
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
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-3 z-[101] flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[90dvh] sm:w-[calc(100%_-_3rem)] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2">
          <header className="relative shrink-0 border-b px-5 py-5 pr-16 sm:px-8 sm:pr-16">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blush">
              Plan Your Wedding
            </p>
            <Dialog.Title className="text-lg font-semibold leading-snug text-ink sm:text-2xl">
              {title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-stone-500">
              Baca ketentuan berikut sebelum menyetujui dan melanjutkan pendaftaran.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup syarat dan ketentuan"
                className="absolute right-3 top-4 grid size-11 place-items-center rounded-full text-stone-500 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blush sm:right-5"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </header>
          <div
            className="min-h-0 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8"
            tabIndex={0}
            role="region"
            aria-label="Dokumen syarat dan ketentuan"
          >
            <nav
              aria-label="Daftar isi syarat dan ketentuan"
              className="mb-8 rounded-xl border bg-stone-50 px-4 py-3"
            >
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-ink">
                  Daftar isi
                </summary>
                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                  {blocks.map((block, index) =>
                    block.text && isHeading(block.text.trim()) ? (
                      <li key={index} className="min-w-0">
                        <a
                          href={`#${sectionId(index)}`}
                          className="block rounded px-1 py-1 text-xs leading-5 text-stone-600 hover:text-blush focus-visible:outline focus-visible:outline-blush"
                        >
                          {block.text.trim()}
                        </a>
                      </li>
                    ) : null,
                  )}
                </ol>
              </details>
            </nav>
            <article className="space-y-4 text-sm leading-7 text-stone-700">
              {blocks.slice(1).map((block, offset) => {
                const index = offset + 1;
                if (block.kind === "table")
                  return (
                    <div
                      key={index}
                      className="overflow-x-auto rounded-lg border"
                      tabIndex={0}
                      role="region"
                      aria-label={`Tabel ketentuan ${index}`}
                    >
                      <table className="w-full border-collapse text-left text-xs leading-6">
                        <thead className="bg-stone-100 text-ink">
                          <tr>
                            {block.rows?.[0]?.map((cell, cellIndex) => (
                              <th
                                key={cellIndex}
                                scope="col"
                                className="min-w-36 border-b px-4 py-3 font-semibold"
                              >
                                {cell}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {block.rows?.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex} className="even:bg-stone-50">
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="whitespace-pre-line px-4 py-3 align-top"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                const text = block.text?.trim() ?? "";
                if (isHeading(text))
                  return (
                    <h2
                      key={index}
                      id={sectionId(index)}
                      tabIndex={-1}
                      className="!mt-9 scroll-mt-6 border-t pt-6 text-base font-semibold leading-7 text-ink"
                    >
                      {text}
                    </h2>
                  );
                if (/^[A-Z]\.\s/.test(text))
                  return (
                    <h3 key={index} className="!mt-6 font-semibold text-ink">
                      {text}
                    </h3>
                  );
                const clause = text.match(/^(\d+\.\d+|\([a-z]\))\s*([\s\S]*)$/);
                return clause ? (
                  <p
                    key={index}
                    className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2 sm:grid-cols-[3.25rem_minmax(0,1fr)]"
                  >
                    <span className="font-medium tabular-nums text-stone-500">{clause[1]}</span>
                    <span className="whitespace-pre-line break-words">{clause[2]}</span>
                  </p>
                ) : (
                  <p key={index} className="whitespace-pre-line break-words">
                    {text}
                  </p>
                );
              })}
            </article>
          </div>
          <footer className="flex shrink-0 flex-col gap-3 border-t bg-stone-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="max-w-md text-xs leading-5 text-stone-500">
              Persetujuan diberikan melalui checkbox pada formulir pendaftaran.
            </p>
            <Dialog.Close asChild>
              <AppButton type="button" variant="secondary">
                Kembali ke pendaftaran
              </AppButton>
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
