import assert from "node:assert/strict";
import test from "node:test";
import { isTermsHeading, parseTermsBlocks } from "../src/features/terms/content.ts";

test("terms file accepts paragraph and table blocks and drops unknown fields", () => {
  const blocks = parseTermsBlocks([
    { kind: "paragraph", text: "1.  DEFINISI", extra: "ignored" },
    { kind: "table", rows: [["Kolom"], ["Isi"]] },
  ]);
  assert.deepEqual(blocks, [
    { kind: "paragraph", text: "1.  DEFINISI" },
    { kind: "table", rows: [["Kolom"], ["Isi"]] },
  ]);
});

test("terms file rejects empty or malformed content with the failing block position", () => {
  assert.throws(() => parseTermsBlocks([]), /tidak kosong/);
  assert.throws(() => parseTermsBlocks({ kind: "paragraph" }), /array/);
  assert.throws(() => parseTermsBlocks([{ kind: "heading", text: "x" }]), /Blok ke-1: kind/);
  assert.throws(
    () =>
      parseTermsBlocks([
        { kind: "paragraph", text: "ok" },
        { kind: "paragraph", text: " " },
      ]),
    /Blok ke-2: text wajib/,
  );
  assert.throws(() => parseTermsBlocks([{ kind: "table", rows: [[1]] }]), /rows harus/);
  assert.throws(() => parseTermsBlocks([{ kind: "table" }]), /wajib memiliki rows/);
});

test("section headings are numbered articles or appendices", () => {
  assert.equal(isTermsHeading("1.  DEFINISI DAN INTERPRETASI"), true);
  assert.equal(isTermsHeading("Lampiran A"), true);
  assert.equal(isTermsHeading("1.1\tPlatform adalah"), false);
});
