import assert from "node:assert/strict";
import test from "node:test";
import { readAllPages } from "../src/shared/api/readAllPages.ts";
import { canPayOrder, canCancelOrder } from "../src/features/orders/rules.ts";

test("complete summary follows server pages, including a server page-size cap", async () => {
  const pages: number[] = [];
  const rows = await readAllPages(async (page) => {
    pages.push(page);
    return { data: [{ id: page }], pageSize: 1, total: 3 };
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(pages, [1, 2, 3]);
});
test("partial or repeating aggregate pages fail instead of showing wrong totals", async () => {
  await assert.rejects(readAllPages(async () => ({ data: [{ id: 1 }], total: 3, pageSize: 1 })));
  await assert.rejects(readAllPages(async () => ({ data: [], total: 3, pageSize: 1 })));
  await assert.rejects(
    readAllPages(async (page) => ({
      data: [{ id: page }],
      total: page === 1 ? 3 : 4,
      pageSize: 1,
    })),
  );
});
test("closed, disputed and inactive orders cannot accept proof in the UI", () => {
  for (const status of ["CANCELLED", "REJECTED_BY_VENDOR", "DISPUTED", "COMPLETED"] as const)
    assert.equal(canPayOrder({ status, active: true }), false);
  assert.equal(canPayOrder({ status: "CONFIRMED", active: false }), false);
  assert.equal(canPayOrder({ status: "CONFIRMED", active: true }), true);
});
test("customer cancellation follows the existing endpoint state contract", () => {
  assert.equal(canCancelOrder({ status: "PENDING_PAYMENT", active: true }), true);
  assert.equal(canCancelOrder({ status: "CONFIRMED", active: true }), true);
  assert.equal(canCancelOrder({ status: "IN_PROGRESS", active: true }), false);
  assert.equal(canCancelOrder({ status: "COMPLETED", active: true }), false);
});

test("budget counts only active verified payments and does not treat pending proof as paid", async () => {
  const { getPaymentSummary } = await import("../src/features/orders/rules.ts");
  const summary = getPaymentSummary({
    totalAmount: 900000,
    payments: [
      { id: "1", amount: 100000, status: "PAID", active: true },
      { id: "2", amount: 800000, status: "WAITING_VERIFICATION", active: true },
      { id: "3", amount: 900000, status: "PAID", active: false },
    ] as Parameters<typeof getPaymentSummary>[0]["payments"],
  });
  assert.equal(summary.paidAmount, 100000);
  assert.equal(summary.pendingVerificationAmount, 800000);
  assert.equal(summary.remainingAmount, 800000);
  assert.equal(summary.isFullyPaid, false);
});
