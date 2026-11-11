import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";
import { createTranslator } from "next-intl";
import { messages, type TranslationKey } from "../src/shared/i18n/catalog.ts";
import { textKeys } from "../src/shared/i18n/textKeys.ts";

const failures: string[] = [];
function flatten(value: object, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof entry === "string" ? [[path, entry]] : Object.entries(flatten(entry, path));
    }),
  );
}
const id = flatten(messages.id);
const en = flatten(messages.en);
if (JSON.stringify(Object.keys(id).sort()) !== JSON.stringify(Object.keys(en).sort()))
  failures.push("Catalog keys differ between id and en");
const translators = {
  id: createTranslator({
    locale: "id",
    messages: messages.id,
    onError: (error) => failures.push(error.message),
  }),
  en: createTranslator({
    locale: "en",
    messages: messages.en,
    onError: (error) => failures.push(error.message),
  }),
};
for (const key of Object.keys(id)) {
  const variables = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  if (JSON.stringify(variables(id[key])) !== JSON.stringify(variables(en[key] ?? "")))
    failures.push(`${key}: placeholders differ`);
  const values = Object.fromEntries(variables(id[key]).map((name) => [name, `{${name}}`]));
  translators.id(key as TranslationKey, values);
  translators.en(key as TranslationKey, values);
}
for (const [source, key] of Object.entries(textKeys)) {
  if (!Object.hasOwn(id, key) || !Object.hasOwn(en, key))
    failures.push(`Unknown compatibility key ${key}: ${source}`);
}

// Only interface copy is checked. Names, descriptions, notes, and backend documents remain data.
const indonesian =
  /\b(Pilih|pilih|Simpan|Hapus|Tambah|Atur|Tidak|tidak|Tampilkan|Sembunyikan|Mohon|Memuat|wajib|dapat|dengan|untuk|yang|Semua|akan|harus|Masukkan|Minimal|maksimal|masih|dan|atau|Anda|kamu|Kamu|telah|perlu|Buka|Pengaturan|Unduh|Pesanan|Paket|Tanggal|Catatan|Jumlah|Diunggah|Tahap)\b/;
const presentationAttributes = new Set([
  "title",
  "description",
  "label",
  "placeholder",
  "helper",
  "aria-label",
  "alt",
  "text",
  "note",
  "emptyMessage",
  "actionLabel",
  "submitLabel",
  "reasonLabel",
]);
async function inspect(directory: URL) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name !== "i18n") await inspect(new URL(`${entry.name}/`, directory));
      continue;
    }
    if (!/\.tsx?$/.test(entry.name)) continue;
    const file = new URL(entry.name, directory);
    const source = ts.createSourceFile(
      file.pathname,
      await readFile(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function report(node: ts.Node, message: string) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      failures.push(`${file.pathname}:${line}: ${message}`);
    }
    function checkLiteral(node: ts.Node, text: string) {
      if (indonesian.test(text) && !Object.hasOwn(textKeys, text))
        report(node, `Missing interface translation: ${text}`);
    }
    function visit(node: ts.Node) {
      if (
        ts.isCallExpression(node) &&
        ["translateText", "translateUI"].includes(node.expression.getText(source))
      ) {
        const first = node.arguments[0];
        if (first && ts.isStringLiteral(first) && !Object.hasOwn(textKeys, first.text))
          report(first, `Unknown interface translation: ${first.text}`);
      }
      if (ts.isJsxText(node)) {
        const text = node.text.replace(/\s+/g, " ").trim();
        if (indonesian.test(text)) report(node, `Untranslated JSX text: ${text}`);
      }
      if (
        ts.isJsxAttribute(node) &&
        presentationAttributes.has(node.name.getText(source)) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      )
        checkLiteral(node.initializer, node.initializer.text);
      if (
        ts.isPropertyAssignment(node) &&
        presentationAttributes.has(node.name.getText(source)) &&
        ts.isStringLiteral(node.initializer)
      )
        checkLiteral(node.initializer, node.initializer.text);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
await inspect(new URL("../src/", import.meta.url));
if (failures.length) {
  console.error([...new Set(failures)].join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `i18n checks passed: ${Object.keys(id).length} message keys, ${Object.keys(textKeys).length} compatibility entries, and interface sources.`,
  );
