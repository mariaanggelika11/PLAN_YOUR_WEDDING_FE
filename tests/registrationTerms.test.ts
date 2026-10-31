import assert from "node:assert/strict";
import test from "node:test";
import { registrationConsent, validateActiveTerms } from "../src/features/auth/termsRules.ts";
import type { TermsDocument } from "../src/features/terms/types.ts";

const terms: TermsDocument = {
  contentHash: "hash",
  createdAt: "2026-11-01T00:00:00Z",
  id: 7,
  termsType: "CUSTOMER",
  title: "Syarat Pengguna",
  version: "1.0",
  content: [
    { kind: "paragraph", text: "Ketentuan" },
    { kind: "table", rows: [["Judul"], ["Isi"]] },
  ],
  isActive: true,
  effectiveAt: "2026-11-01T00:00:00Z",
};
test("registration consent preserves boolean true and the exact displayed version ID", () => {
  assert.deepEqual(registrationConsent(true, 7), { acceptedTerms: true, termsVersionId: 7 });
  assert.throws(() => registrationConsent(false, 7), /menyetujui/);
  assert.throws(() => registrationConsent("true" as never, 7), /menyetujui/);
  for (const id of [0, -1, 1.5, NaN, Infinity])
    assert.throws(() => registrationConsent(true, id), /Versi/);
});
test("active terms must belong to the registration role and include usable content", () => {
  assert.equal(validateActiveTerms(terms, "customer"), terms);
  assert.equal(validateActiveTerms({ ...terms, termsType: "VENDOR" }, "vendor").id, 7);
  for (const invalid of [
    { ...terms, termsType: "VENDOR" },
    { ...terms, isActive: false },
    { ...terms, id: 0 },
    { ...terms, content: [] },
    { ...terms, title: " " },
    { ...terms, content: [{ kind: "html", text: "unsupported" }] },
  ])
    assert.throws(() => validateActiveTerms(invalid as TermsDocument, "customer"));
});
