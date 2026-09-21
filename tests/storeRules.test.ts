import assert from "node:assert/strict";
import test from "node:test";
import { assertStoreOwnership, parseStoreId } from "../src/features/marketplace/storeRules.ts";

test("store routes accept only positive safe vendor IDs", () => {
  assert.equal(parseStoreId("31"), 31);
  for (const id of ["", "0", "-1", "1.5", "../1", "Infinity", "9007199254740992"]) {
    assert.throws(() => parseStoreId(id));
  }
});

test("store data cannot include a different vendor or missing ownership", () => {
  assert.doesNotThrow(() => assertStoreOwnership([{ vendor: { id: 31 } }], 31));
  assert.doesNotThrow(() => assertStoreOwnership([], 31));
  assert.throws(() => assertStoreOwnership([{ vendor: { id: 31 } }, { vendor: { id: 32 } }], 31));
  assert.throws(() => assertStoreOwnership([{}], 31));
});
