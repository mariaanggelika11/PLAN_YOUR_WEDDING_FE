import { isTermsHeading } from "@/features/terms/content";
import type { TermsBlock } from "@/features/terms/types";

/** Renders terms content blocks (table of contents + article). Presentation only. */
export function TermsDocumentView({
  blocks,
  idPrefix,
}: {
  blocks: TermsBlock[];
  idPrefix: string;
}) {
  const sectionId = (index: number) => `${idPrefix}-${index}`;
  return (
    <>
      <nav
        aria-label="Daftar isi syarat dan ketentuan"
        className="mb-8 rounded-xl border bg-stone-50 px-4 py-3"
      >
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-ink">Daftar isi</summary>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {blocks.map((block, index) =>
              block.text && isTermsHeading(block.text.trim()) ? (
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
        {blocks.map((block, index) => {
          if (block.kind === "table")
            return (
              <div
                key={index}
                className="overflow-x-auto rounded-lg border"
                tabIndex={0}
                role="region"
                aria-label={`Tabel ketentuan ${index + 1}`}
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
                          <td key={cellIndex} className="whitespace-pre-line px-4 py-3 align-top">
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
          if (isTermsHeading(text))
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
    </>
  );
}
