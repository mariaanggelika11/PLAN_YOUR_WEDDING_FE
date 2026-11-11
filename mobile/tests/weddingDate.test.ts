import { test } from "node:test";
import assert from "node:assert/strict";
import { weddingDaysRemaining } from "../src/domain/weddingDate.ts";

test("wedding countdown uses the local calendar day and preserves past/today states", () => {
  const evening = new Date(2026, 10, 11, 23, 59);
  assert.equal(weddingDaysRemaining("2026-11-12", evening), 1);
  assert.equal(weddingDaysRemaining("2026-11-11T00:00:00Z", evening), 0);
  assert.equal(weddingDaysRemaining("2026-11-10", evening), -1);
  assert.equal(weddingDaysRemaining("2027-01-01", new Date(2026, 11, 31, 23)), 1);
});

test("missing or impossible wedding dates ask for profile completion", () => {
  for (const value of [undefined, null, "", "invalid", "2026-02-30", "2026-13-01"])
    assert.equal(weddingDaysRemaining(value), null);
  assert.equal(weddingDaysRemaining("2028-02-29", new Date(2028, 1, 28)), 1);
});
