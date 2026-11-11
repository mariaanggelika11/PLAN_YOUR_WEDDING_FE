import { test as base, expect, type Page, type Route } from "@playwright/test";
import type { Order } from "../src/features/orders/types";

export const order: Order = {
  id: "101",
  orderNumber: "PYW-TEST-101",
  customer: { id: 1, fullName: "Test Customer" },
  vendor: { id: 2, businessName: "Video Keren" },
  vendorProduct: { id: "10", name: "Rangga" },
  productName: "Rangga",
  productPrice: 30000000,
  productMinimumDp: 10000000,
  eventDate: "2027-10-24",
  eventLocation: "Gedung UBL",
  guestCount: 1000,
  notes: null,
  paymentType: "FULL",
  totalAmount: 30000000,
  paidAmount: 30000000,
  outstandingAmount: 0,
  status: "COMPLETED",
  rejectReason: null,
  confirmedAt: "2026-10-01T00:00:00Z",
  completedAt: "2026-10-24T00:00:00Z",
  active: true,
  createdAt: "2026-09-01T00:00:00Z",
  payments: [
    {
      id: "201",
      installment: "FULL",
      amount: 30000000,
      bankName: "Test Bank",
      accountNumber: "1234567890",
      accountHolderName: "Vendor Test",
      status: "PAID",
      rejectReason: null,
      paidAt: "2026-09-01T00:00:00Z",
      verifiedAt: "2026-09-02T00:00:00Z",
      proofAttachmentId: null,
      proofs: [],
    },
  ],
};
export const product = {
  id: "10",
  vendor: { id: 2, businessName: "Video Keren" },
  name: "Rangga",
  category: "Photography",
  description: "Deskripsi asli vendor",
  price: 30000000,
  minimumDp: 10000000,
  duration: "8 hours",
  guestCapacity: 1000,
  serviceArea: "Jakarta",
  terms: "Vendor terms",
  status: "ACTIVE",
  active: true,
  imageAttachmentIds: [],
  averageRating: 4.5,
  reviewCount: 0,
  soldCount: 1,
};
export const customerProfile = {
  id: 1,
  user: { id: 1, email: "test@example.com", fullname: "Test Customer" },
  fullName: "Test Customer",
  weddingDate: "2027-10-24",
  weddingLocation: "Gedung UBL",
  estimatedGuests: 1000,
  estimatedBudget: 50000000,
};
const budget = {
  budgetSet: true,
  totalBudget: 50000000,
  committedAmount: 30000000,
  verifiedPayments: 30000000,
  remainingBudget: 20000000,
  outstandingBills: 0,
  overBudget: false,
  items: [],
  byCategory: [],
};
function pageData(data: unknown[] = []) {
  return { data, total: data.length, pageNumber: 1, pageSize: 10 };
}
export async function json(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(status < 400 ? { data } : data),
  });
}

/** Test fixtures intercept all backend calls. No test can create a real account/order/payment. */
export async function mockBackend(page: Page) {
  await page.route("**/backend-api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/backend-api", "");
    if (route.request().method() !== "GET")
      return json(route, { message: "Unexpected mutation in fixture" }, 405);
    if (path === "/notifications") return json(route, { ...pageData(), unreadCount: 0 });
    if (path === "/terms/me/status") return json(route, { requiresAcceptance: false, pending: [] });
    if (path.startsWith("/terms/active/"))
      return json(route, {
        id: 1,
        termsType: path.endsWith("vendor") ? "VENDOR" : "CUSTOMER",
        version: "1.0",
        title: "Test terms",
        content: [{ kind: "paragraph", text: "Test terms content" }],
        contentHash: "test",
        effectiveAt: "2026-01-01",
        isActive: true,
        createdAt: "2026-01-01",
      });
    if (path === "/customer-profile/user/1") return json(route, customerProfile);
    if (path === "/vendor-profile/user/1")
      return json(route, {
        id: 2,
        user: customerProfile.user,
        businessName: "Video Keren",
        categories: [],
        contacts: [],
        bankAccounts: [],
        verificationDocuments: [],
        portfolioAttachmentIds: [],
        isVerified: true,
        status: 3,
        active: true,
      });
    if (path === "/dashboard/summary") {
      const role = url.searchParams.get("role") ?? "customer";
      return json(route, {
        role,
        recentOrders: [order],
        orders: { total: 1, active: 0, completed: 1, incoming: 0, byStatus: { COMPLETED: 1 } },
        payments: { needAction: 0, waitingVerification: 0 },
        vendorsBooked: 1,
        budget,
        tasks: { total: 0, completed: 0, skipped: 0, progressPercent: 0 },
        products: { total: 1, active: 1 },
        paymentsToVerify: 0,
        revenue: role === "vendor" ? { thisMonth: 0, total: 0 } : 0,
        rating: { average: 0, count: 0 },
        users: { total: 1, customers: 1 },
        vendors: { total: 1, pendingVerification: 0, verified: 1 },
        paymentsPending: 0,
        openDisputes: 0,
      });
    }
    if (path === "/budget/summary") return json(route, budget);
    if (path === "/orders/101") return json(route, order);
    if (path === "/orders/101/messages") return json(route, { ...pageData(), canSend: false });
    if (path === "/orders") return json(route, pageData([order]));
    if (path === "/vendor-products/filter-options")
      return json(route, {
        locations: ["Jakarta"],
        priceRange: { min: 0, max: 50000000 },
        maxCapacity: 1000,
        sortOptions: ["newest", "price_asc", "price_desc", "rating", "popular"],
      });
    if (path === "/vendor-products/10") return json(route, product);
    if (path === "/vendor-products") return json(route, pageData([product]));
    if (path === "/vendor-products/10/availability")
      return json(route, {
        vendorProductId: "10",
        eventDate: url.searchParams.get("eventDate"),
        available: true,
        capacity: 1,
        bookedCount: 0,
        remaining: 1,
        reason: null,
        message: "Available",
      });
    if (path === "/parameter" || path === "/attachments" || path === "/vendor-product-reviews")
      return json(route, pageData());
    return json(route, { message: `Unmocked fixture path: ${path}` }, 501);
  });
}

export async function signInFixture(
  page: Page,
  role: "CUSTOMER" | "VENDOR" | "ADMIN" = "CUSTOMER",
  locale: "id" | "en" = "en",
) {
  await page.context().addCookies([
    { name: "pyw_role", value: role, url: "http://127.0.0.1:3107" },
    { name: "pyw-locale", value: locale, url: "http://127.0.0.1:3107" },
  ]);
  await page.addInitScript(
    ({ role }) => {
      if (sessionStorage.getItem("fixture-seeded")) return;
      sessionStorage.setItem("fixture-seeded", "true");
      localStorage.setItem(
        "pyw_auth_session",
        JSON.stringify({
          user: { id: "1", name: "Test User", email: "test@example.com", role, status: "ACTIVE" },
          accessToken: "fixture-token",
          expiresAt: "2099-01-01T00:00:00Z",
        }),
      );
    },
    { role },
  );
}

export const test = base.extend<{ backend: void }>({
  backend: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await mockBackend(page);
      await use();
      if (!testInfo.annotations.some((annotation) => annotation.type === "expected-boundary-error"))
        expect(errors, "Unexpected browser runtime errors").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
