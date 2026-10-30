import assert from "node:assert/strict";
import test from "node:test";
import {
  confirmationDeadline,
  confirmationTimeLeft,
  conversationClosedReason,
} from "../src/features/orders/completion.ts";

test("confirmation deadline uses only a valid API deadline while waiting for customer", () => {
  const autoCompleteAt = "2026-11-06T09:00:00Z";
  assert.equal(
    confirmationDeadline({ status: "WAITING_CUSTOMER_CONFIRMATION", autoCompleteAt }),
    Date.parse(autoCompleteAt),
  );
  for (const value of [undefined, null, "invalid"]) {
    assert.equal(
      confirmationDeadline({ status: "WAITING_CUSTOMER_CONFIRMATION", autoCompleteAt: value }),
      null,
    );
  }
  for (const status of ["COMPLETED", "DISPUTED", "REJECTED_BY_VENDOR"] as const) {
    assert.equal(confirmationDeadline({ status, autoCompleteAt }), null);
  }
});
test("countdown handles deadline boundaries without marking orders complete", () => {
  const now = Date.parse("2026-10-30T09:00:00Z");
  assert.equal(confirmationTimeLeft(now, now), "Batas waktu konfirmasi telah lewat.");
  assert.equal(confirmationTimeLeft(now - 1, now), "Batas waktu konfirmasi telah lewat.");
  assert.equal(confirmationTimeLeft(now + 1, now), "Sisa waktu 1 menit.");
  assert.equal(confirmationTimeLeft(now + 7 * 86400000, now), "Sisa waktu 7 hari 0 jam.");
});
test("rejected and cancelled chats explain read-only mode; completed chats still defer to API permissions", () => {
  assert.match(conversationClosedReason("REJECTED_BY_VENDOR")!, /ditolak/);
  assert.match(conversationClosedReason("CANCELLED")!, /dibatalkan/);
  for (const status of ["COMPLETED", "DISPUTED", "IN_PROGRESS"] as const)
    assert.equal(conversationClosedReason(status), null);
});
