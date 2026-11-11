import { test, expect, signInFixture, json, order } from "./fixtures";

const payment = {
  ...order.payments![0],
  status: "WAITING_PAYMENT" as const,
  paidAt: null,
  verifiedAt: null,
};

test("payment proof validation rejects unsupported files and sends one multipart upload", async ({
  page,
}) => {
  await signInFixture(page);
  const pending = {
    ...order,
    status: "PENDING_PAYMENT",
    paidAmount: 0,
    outstandingAmount: order.totalAmount,
    payments: [payment],
  };
  let uploads = 0;
  await page.route("**/backend-api/orders/101", (route) =>
    json(route, {
      ...pending,
      payments: [{ ...payment, status: uploads ? "WAITING_VERIFICATION" : "WAITING_PAYMENT" }],
    }),
  );
  await page.route("**/backend-api/order-payments/201/proof", async (route) => {
    expect(route.request().method()).toBe("PUT");
    expect(route.request().headers()["content-type"]).toContain("multipart/form-data");
    expect(route.request().postDataBuffer()?.toString()).toContain('name="proof"');
    uploads++;
    await json(route, { ...payment, status: "WAITING_VERIFICATION" });
  });
  await page.goto("/customer/payment/101");
  const file = page.locator('input[type="file"]');
  await file.setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("invalid"),
  });
  await page.getByRole("button", { name: "Submit payment receipt", exact: true }).click();
  await expect(page.getByText("Receipts must be JPG, PNG, or PDF.", { exact: true })).toBeVisible();
  expect(uploads).toBe(0);
  await page.getByRole("button", { name: "Close popup", exact: true }).click();
  await file.setInputFiles({
    name: "receipt.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nTest receipt"),
  });
  await page.getByRole("button", { name: "Submit payment receipt", exact: true }).click();
  await expect(page).toHaveURL("/customer/orders/101");
  expect(uploads).toBe(1);
  await expect(page.getByText("Awaiting verification", { exact: true }).first()).toBeVisible();
});

test("vendor payment verification requires confirmation and performs one status mutation", async ({
  page,
}) => {
  await signInFixture(page, "VENDOR");
  let verified = false;
  const waiting = { ...payment, status: "WAITING_VERIFICATION", proofAttachmentId: "proof-test" };
  await page.route("**/backend-api/orders/101", (route) =>
    json(route, {
      ...order,
      status: "WAITING_VENDOR_CONFIRMATION",
      paidAmount: verified ? order.totalAmount : 0,
      outstandingAmount: verified ? 0 : order.totalAmount,
      payments: [{ ...waiting, status: verified ? "PAID" : "WAITING_VERIFICATION" }],
    }),
  );
  await page.route("**/backend-api/attachments/proof-test/file", (route) =>
    route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4\nTest receipt" }),
  );
  let mutations = 0;
  await page.route("**/backend-api/order-payments/201/verify", async (route) => {
    expect(route.request().method()).toBe("PUT");
    mutations++;
    verified = true;
    await json(route, { ...waiting, status: "PAID" });
  });
  await page.goto("/vendor/orders/101");
  await page.getByRole("button", { name: "Verify Full payment", exact: true }).click();
  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation).toContainText("Verify payment?");
  expect(mutations).toBe(0);
  await confirmation.getByRole("button", { name: "Verify", exact: true }).click();
  await expect.poll(() => mutations).toBe(1);
  await expect(page.getByText("Payment verified.", { exact: true })).toBeVisible();
});
