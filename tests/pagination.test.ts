import test from "node:test";
import assert from "node:assert/strict";
import { paginationPages } from "../src/shared/components/navigation/paginationPages.ts";

test("pagination handles empty results, short lists and both boundaries", () => {
  assert.deepEqual(paginationPages(1, 0), [1]);
  assert.deepEqual(paginationPages(2, 3), [1, 2, 3]);
  assert.deepEqual(paginationPages(1, 20), [1, 2, 3, 4, 5, "ellipsis", 20]);
  assert.deepEqual(paginationPages(10, 20), [1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  assert.deepEqual(paginationPages(20, 20), [1, "ellipsis", 16, 17, 18, 19, 20]);
});

test("large lists stay compact while keeping current, first and last pages accessible", () => {
  for (let total = 1; total <= 200; total++) {
    for (let page = 1; page <= total; page++) {
      const items = paginationPages(page, total);
      const numbers = items.filter((item): item is number => typeof item === "number");
      assert.ok(items.length <= 7);
      assert.ok(numbers.includes(page));
      assert.equal(numbers[0], 1);
      assert.equal(numbers.at(-1), total);
      assert.deepEqual(
        numbers,
        [...new Set(numbers)].sort((a, b) => a - b),
      );
    }
  }
});
