import assert from "node:assert/strict";
import test from "node:test";
import { findOrderReview } from "../src/features/reviews/metrics.ts";

test("review must belong to the requested order, including repeat purchases", () => {
  const reviews = [
    { order: { id: "1", orderNumber: "PYW-1" } },
    { order: { id: "2", orderNumber: "PYW-2" } },
  ];
  assert.equal(findOrderReview(reviews, "2"), reviews[1]);
  assert.equal(findOrderReview(reviews, "3"), null);
  assert.equal(findOrderReview([{}], "3"), null);
  assert.equal(findOrderReview([], "3"), null);
});
