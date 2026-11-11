import React from "react";
import { Alert, Dimensions, Text } from "react-native";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import i18n from "i18next";
import { createApi } from "../src/api/client";
import { languageReady } from "../src/i18n";
import { AuthScreen } from "../src/screens/AuthScreen";
import { LandingScreen } from "../src/screens/LandingScreen";
import { NavigationShell, WorkspaceHeader } from "../src/components/NavigationChrome";
import { ConsentGate } from "../src/components/ConsentGate";
import { Terms } from "../src/components/Terms";
import { DashboardScreen } from "../src/screens/DashboardScreen";
import { MoreScreen } from "../src/screens/MoreScreen";
import { OrderScreen, PaymentsScreen } from "../src/screens/OrderScreens";
import { TaskScreen, PlanningSettingsScreen } from "../src/screens/PlanningScreens";
import { VendorDetailScreen } from "../src/screens/AdminScreens";
import { CheckoutScreen } from "../src/screens/ProductScreens";
import type { Order, Role, Session, TermsDocument } from "../src/domain/contracts";
import { canVisit } from "../src/navigation";

let mockRole: Role = "CUSTOMER";
let mockOrderStatus: Order["status"] = "WAITING_VENDOR_CONFIRMATION";
let mockPaymentStatus = "WAITING_VERIFICATION";
let mockVendorStatus = 2;
let mockProfileStatus = 200;
let mockPendingTerms: TermsDocument[] = [];
let mockTermsAcceptFailure = 0;
const mockNavigate = jest.fn();
const mockAuthenticate = jest.fn();
const mockLogout = jest.fn();
const mockCalls: { path: string; method: string; body: unknown }[] = [];
const mockSession = (): Session => ({
  accessToken: "fixture-token",
  user: { id: 1, name: "Test User", email: "test@example.com", role: mockRole },
});
const mockOrder = () => ({
  id: "101",
  orderNumber: "PYW-TEST-101",
  status: mockOrderStatus,
  active: true,
  vendor: { id: 2, businessName: "Video Keren" },
  customer: { id: 1, fullName: "Test Customer" },
  vendorProduct: { id: "10", name: "Rangga" },
  productName: "Rangga",
  eventDate: "2027-10-24",
  eventLocation: "Gedung UBL",
  guestCount: 1000,
  totalAmount: 30000000,
  paidAmount: 30000000,
  payments: [],
});
const mockApi = createApi({
  baseUrl: "https://backend.invalid",
  getSession: mockSession,
  onUnauthorized: jest.fn(),
  fetcher: async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method || "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    mockCalls.push({ path: url.pathname, method, body });
    let data: unknown;
    if (url.pathname === "/cryptography/encrypt") data = { cipherText: "cipher" };
    else if (url.pathname === "/auth/login")
      data = {
        access_token: "fixture-token",
        user: { id: 1, fullname: "Test User", email: "test@example.com", isEmailVerified: true },
        roles: { roleName: mockRole },
      };
    else if (url.pathname === "/dashboard/summary")
      data = {
        role: mockRole.toLowerCase(),
        orders: { total: 1, active: 1 },
        recentOrders: [mockOrder()],
        users: { total: 1 },
        vendors: { pendingVerification: 0 },
        products: { active: 1 },
        revenue: { thisMonth: 0 },
      };
    else if (url.pathname === "/orders/101/confirm") {
      mockOrderStatus = "CONFIRMED";
      data = mockOrder();
    } else if (url.pathname === "/orders/101") data = mockOrder();
    else if (url.pathname === "/orders" && method === "POST") data = { ...mockOrder(), id: "102" };
    else if (url.pathname === "/vendor-products/10")
      data = {
        id: "10",
        vendor: { id: 2, businessName: "Video Keren" },
        name: "Rangga",
        price: 30000000,
        minimumDp: 10000000,
        guestCapacity: 1000,
        active: true,
        status: "ACTIVE",
        imageAttachmentIds: [],
      };
    else if (url.pathname === "/vendor-products/10/availability")
      data = {
        vendorProductId: "10",
        eventDate: url.searchParams.get("eventDate"),
        available: true,
        remaining: 1,
      };
    else if (url.pathname === "/customer-profile/user/1") {
      if (mockProfileStatus !== 200)
        return {
          ok: false,
          status: mockProfileStatus,
          text: async () => JSON.stringify({}),
        } as Response;
      data = { weddingDate: "2027-10-24", weddingLocation: "Gedung UBL", estimatedGuests: 1000 };
    } else if (url.pathname.startsWith("/terms/active/"))
      data = {
        id: 1,
        termsType: url.pathname.endsWith("vendor") ? "VENDOR" : "CUSTOMER",
        title: "Fixture terms",
        version: "v1",
        isActive: true,
        contentHash: "fixture",
        content: [{ kind: "paragraph", text: "Fixture terms body" }],
      };
    else if (url.pathname === "/terms/me/status")
      data = { requiresAcceptance: mockPendingTerms.length > 0, pending: mockPendingTerms };
    else if (url.pathname === "/terms/accept") {
      if (mockTermsAcceptFailure) {
        const status = mockTermsAcceptFailure;
        if (status === 409) mockPendingTerms = [pendingTerms(2)];
        mockTermsAcceptFailure = 0;
        return {
          ok: false,
          status,
          text: async () =>
            JSON.stringify({ code: status === 409 ? "TERMS_OUTDATED" : "REQUEST_FAILED" }),
        } as Response;
      }
      mockPendingTerms = mockPendingTerms.filter((document) => document.id !== body.termsVersionId);
      data = {};
    } else if (url.pathname === "/register/customer" || url.pathname === "/register/vendor")
      data = { id: 1 };
    else if (url.pathname === "/order-payments/201/verify") {
      mockPaymentStatus = "PAID";
      data = {};
    } else if (url.pathname === "/order-payments/201")
      data = {
        id: "201",
        amount: 30000000,
        status: mockPaymentStatus,
        installment: "FULL",
        proofAttachmentId: "proof-1",
      };
    else if (url.pathname === "/vendor-profile/2/reject") {
      mockVendorStatus = 4;
      data = {};
    } else if (url.pathname === "/vendor-profile/2")
      data = {
        id: 2,
        businessName: "Video Keren",
        ownerName: "Owner",
        status: mockVendorStatus,
        verificationDocuments: [
          { id: "doc-1", documentType: "NIB", documentNumber: "123", attachmentId: "doc-file" },
        ],
      };
    else if (url.pathname === "/wedding-tasks/task-1")
      data = {
        id: "task-1",
        title: "Family plan",
        category: "Family",
        guide: "",
        dueDate: "2027-10-20",
        customDue: false,
        important: false,
        status: "TODO",
        subtasks: [{ id: "sub-1", title: "Choose date", done: false, sortOrder: 1 }],
      };
    else if (url.pathname === "/wedding-plans")
      data = { id: 99, traditional: false, outdoor: false, useWo: false, autoReschedule: true };
    else throw new Error(`Unexpected fixture endpoint: ${method} ${url.pathname}`);
    return { ok: true, status: 200, text: async () => JSON.stringify({ data }) } as Response;
  },
});
jest.mock("../src/auth/Provider", () => ({
  useAuth: () => ({
    api: mockApi,
    session: mockSession(),
    ready: true,
    storageError: false,
    authenticate: mockAuthenticate,
    logout: mockLogout,
  }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockNavigate,
    navigate: mockNavigate,
    replace: mockNavigate,
    back: jest.fn(),
    canGoBack: () => true,
  }),
  usePathname: () => "/dashboard",
  useGlobalSearchParams: () => ({}),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void | (() => void)) => {
    require("react").useEffect(callback, [callback]);
  },
}));
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("../src/components/Attachment", () => ({
  AttachmentImage: () => null,
  AttachmentButton: () => null,
  chooseFile: jest.fn(),
  appendFile: jest.fn(),
}));
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(async () => {
  await languageReady;
  await i18n.changeLanguage("en");
  mockRole = "CUSTOMER";
  mockOrderStatus = "WAITING_VENDOR_CONFIRMATION";
  mockPaymentStatus = "WAITING_VERIFICATION";
  mockVendorStatus = 2;
  mockProfileStatus = 200;
  mockPendingTerms = [];
  mockTermsAcceptFailure = 0;
  mockCalls.length = 0;
  jest.clearAllMocks();
  await act(async () =>
    Dimensions.set({
      window: { width: 411, height: 914, scale: 2.625, fontScale: 1 },
      screen: { width: 411, height: 914, scale: 2.625, fontScale: 1 },
    }),
  );
});

test("public landing explains the service without authenticated requests and opens sign-in", async () => {
  await render(<LandingScreen />);
  expect(screen.getByText("Your special day starts with a plan that feels easy.")).toBeTruthy();
  expect(mockCalls).toHaveLength(0);
  await fireEvent.press(screen.getByRole("button", { name: "Explore vendor packages" }));
  expect(mockNavigate).toHaveBeenCalledWith("/auth");
});

test("landing registration actions preserve customer and vendor account choices", async () => {
  await render(<LandingScreen />);
  for (const mode of ["customer", "vendor"]) {
    await fireEvent.press(screen.getByRole("button", { name: `Register as a ${mode}` }));
    expect(mockNavigate).toHaveBeenLastCalledWith({ pathname: "/auth", params: { mode } });
  }
  expect(mockCalls).toHaveLength(0);
});

for (const role of ["CUSTOMER", "VENDOR", "ADMIN"] as const) {
  test(`${role} hamburger shows permitted destinations and closes after navigation`, async () => {
    mockRole = role;
    await render(
      <NavigationShell>
        <WorkspaceHeader />
      </NavigationShell>,
    );
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Navigation menu" }));
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(Boolean(screen.queryByRole("button", { name: "Users" }))).toBe(role === "ADMIN");
    expect(Boolean(screen.queryByRole("button", { name: "Wedding preparation" }))).toBe(
      role === "CUSTOMER",
    );
    const label =
      role === "CUSTOMER" ? "Marketplace" : role === "VENDOR" ? "Products" : "Vendor verification";
    await fireEvent.press(screen.getByRole("button", { name: label }));
    expect(mockNavigate).toHaveBeenCalledWith(
      role === "CUSTOMER" ? "/marketplace" : role === "VENDOR" ? "/products" : "/verification",
    );
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });
}

test("wide layouts expose a permanent sidebar with the same role restrictions", async () => {
  await act(async () =>
    Dimensions.set({
      window: { width: 1024, height: 1366, scale: 1, fontScale: 1 },
      screen: { width: 1024, height: 1366, scale: 1, fontScale: 1 },
    }),
  );
  await render(
    <NavigationShell>
      <WorkspaceHeader />
    </NavigationShell>,
  );
  expect(screen.queryByRole("button", { name: "Navigation menu" })).toBeNull();
  expect(screen.getByRole("button", { name: "Wedding preparation" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Users" })).toBeNull();
});

test("customer dashboard shortcuts use existing feature routes and load wedding profile", async () => {
  await render(<DashboardScreen />);
  await screen.findByText("Gedung UBL");
  for (const [label, kind] of [
    ["Find vendors", "marketplace"],
    ["My orders", "orders"],
    ["Wedding preparation", "planning"],
    ["View budget", "budget"],
  ]) {
    await fireEvent.press(screen.getByRole("button", { name: label }));
    expect(mockNavigate).toHaveBeenLastCalledWith({ pathname: "/page", params: { kind } });
  }
  expect(mockCalls.every((call) => call.method === "GET")).toBe(true);
});

for (const role of ["CUSTOMER", "VENDOR", "ADMIN"] as const) {
  test(`native sign-in preserves the ${role} primary role`, async () => {
    mockRole = role;
    await render(<AuthScreen />);
    await fireEvent.changeText(screen.getByLabelText("Email"), "test@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "Password1!");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(mockAuthenticate).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ role }) }),
        true,
      ),
    );
    expect(mockCalls.find((call) => call.path === "/auth/login")?.body).toEqual({
      email: "test@example.com",
      password: "cipher",
    });
  });
  test(`${role} dashboard renders real API fields and original vendor names`, async () => {
    mockRole = role;
    await render(<DashboardScreen />);
    await screen.findByText("PYW-TEST-101");
    expect(screen.getByText(/Video Keren/)).toBeTruthy();
    expect(mockCalls.some((call) => call.path === "/dashboard/summary")).toBe(true);
  });
}
test("native navigation separates customer, vendor and admin capabilities", async () => {
  expect(canVisit("CUSTOMER", "users")).toBe(false);
  expect(canVisit("VENDOR", "checkout")).toBe(false);
  expect(canVisit("ADMIN", "product-edit")).toBe(false);
  expect(canVisit("ADMIN", "vendor-detail")).toBe(true);
  await render(<MoreScreen />);
  expect(screen.queryByText("Users")).toBeNull();
  expect(screen.getByText("Wedding preparation")).toBeTruthy();
});
test("language switching retains a native form draft", async () => {
  await i18n.changeLanguage("id");
  await render(<AuthScreen />);
  await fireEvent.changeText(screen.getByLabelText("Email"), "draft@example.com");
  await fireEvent.press(screen.getByRole("button", { name: "ID" }));
  await screen.findByText("Welcome back");
  expect(screen.getByDisplayValue("draft@example.com")).toBeTruthy();
});

test("the remember-me checkbox still controls session persistence", async () => {
  await render(<AuthScreen />);
  await fireEvent.press(screen.getByRole("checkbox", { name: "Remember me" }));
  await fireEvent.changeText(screen.getByLabelText("Email"), "test@example.com");
  await fireEvent.changeText(screen.getByLabelText("Password"), "Password1!");
  await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(mockAuthenticate).toHaveBeenCalledWith(expect.anything(), false));
});

test("registration examples remain placeholders and cannot be submitted as user data", async () => {
  await render(<AuthScreen initialFlow="vendor" />);
  await screen.findByRole("button", { name: "Vendor terms and conditions" });
  for (const placeholder of [
    "e.g. Ayu Putri",
    "e.g. Laras Wedding",
    "name@example.com",
    "e.g. 081234567890",
    "e.g. Jl. Melati No. 10",
  ]) {
    expect(screen.getByPlaceholderText(placeholder).props.value).toBe("");
  }
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "I agree to the terms and conditions" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Create account" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled());
  expect(mockCalls.filter((call) => call.method !== "GET")).toHaveLength(0);
  expect(screen.getByLabelText("Owner name").props.value).toBe("");
});

test("field examples switch language without losing a draft and password guidance stays visible", async () => {
  await i18n.changeLanguage("id");
  await render(<AuthScreen initialFlow="vendor" />);
  await screen.findByRole("button", { name: "Syarat dan ketentuan mitra vendor" });
  expect(screen.getByPlaceholderText("Contoh: Ayu Putri")).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText("Nama pemilik"), "Ayu draft");
  await fireEvent.changeText(screen.getByLabelText("Password"), "DraftPass1!");
  await fireEvent.press(screen.getByRole("button", { name: "ID" }));
  await screen.findByPlaceholderText("e.g. Laras Wedding");
  expect(screen.getByDisplayValue("Ayu draft")).toBeTruthy();
  expect(
    screen.getByText(
      "At least 8 characters, including an uppercase letter, a number, and a symbol.",
    ),
  ).toBeTruthy();
  expect(mockCalls.every((call) => call.method === "GET")).toBe(true);
});

for (const mode of ["customer", "vendor"] as const) {
  test(`direct ${mode} registration retains mandatory terms consent`, async () => {
    await render(<AuthScreen initialFlow={mode} />);
    const trigger = await screen.findByRole("button", {
      name: mode === "customer" ? "Customer terms and conditions" : "Vendor terms and conditions",
    });
    expect(screen.queryByText("Fixture terms body")).toBeNull();
    const field = mode === "customer" ? "Full name" : "Business name";
    await fireEvent.changeText(screen.getByLabelText(field), "Saved draft");
    await fireEvent.press(trigger);
    await screen.findByText("Fixture terms body");
    await fireEvent.press(screen.getByRole("button", { name: "Back to registration" }));
    expect(screen.queryByText("Fixture terms body")).toBeNull();
    expect(screen.getByDisplayValue("Saved draft")).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: "I agree to the terms and conditions" }),
    ).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
    expect(mockCalls.filter((call) => call.method !== "GET")).toHaveLength(0);
  });
}

test("registration document closes using Android Back without giving consent", async () => {
  await render(<AuthScreen initialFlow="customer" />);
  await fireEvent.press(
    await screen.findByRole("button", { name: "Customer terms and conditions" }),
  );
  await screen.findByText("Fixture terms body");
  await fireEvent(screen.getByTestId("terms-dialog"), "requestClose");
  expect(screen.queryByText("Fixture terms body")).toBeNull();
  expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
});

test("registration keeps checkbox consent separate and submits the API terms version", async () => {
  await render(<AuthScreen initialFlow="customer" />);
  await screen.findByRole("button", { name: "Customer terms and conditions" });
  for (const [field, value] of [
    ["Full name", "Test User"],
    ["Email", "test@example.com"],
    ["Phone number", "08123456789"],
    ["Password", "Password1!"],
    ["Confirm password", "Password1!"],
  ]) {
    await fireEvent.changeText(screen.getByLabelText(field), value);
  }
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "I agree to the terms and conditions" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Create account" }));
  await screen.findByRole("button", { name: "Verify OTP" });
  expect(mockCalls.find((call) => call.path === "/register/customer")?.body).toMatchObject({
    acceptedTerms: true,
    termsVersionId: 1,
    password: "cipher",
    confirmPassword: "cipher",
  });
});

const pendingTerms = (id: number): TermsDocument => ({
  id,
  termsType: "CUSTOMER",
  title: `Updated terms ${id}`,
  version: `v${id}`,
  contentHash: `hash-${id}`,
  effectiveAt: "2026-11-11",
  isActive: true,
  createdAt: "2026-11-11",
  content: [{ kind: "paragraph", text: `Document body ${id}` }],
});

for (const viewport of [
  { width: 320, fontScale: 1.5 },
  { width: 1024, fontScale: 1 },
]) {
  test(`terms preserve every table cell and clause at ${viewport.width}dp and ${viewport.fontScale} font scale`, async () => {
    await act(async () =>
      Dimensions.set({
        window: { width: viewport.width, height: 914, scale: 1, fontScale: viewport.fontScale },
        screen: { width: viewport.width, height: 914, scale: 1, fontScale: viewport.fontScale },
      }),
    );
    const document: TermsDocument = {
      ...pendingTerms(1),
      content: [
        { kind: "paragraph", text: "B. Pembatalan atau kegagalan oleh Vendor" },
        { kind: "paragraph", text: "1.1.2 Hak customer tetap mengikuti dokumen asli." },
        {
          kind: "table",
          rows: [
            ["Keadaan", "Hak Customer"],
            [
              "Vendor membatalkan, kapan pun",
              "Pengembalian 100% atas seluruh pembayaran, termasuk Biaya Layanan Platform, ditambah bantuan pencarian Vendor pengganti.",
            ],
            [
              "Vendor tidak hadir atau gagal melaksanakan jasa",
              "Pengembalian 100% atas bagian yang tidak dilaksanakan.",
              "Catatan tambahan dari API",
            ],
          ],
        },
      ],
    };
    await render(<Terms document={document} articleOnly />);
    expect(screen.getByText("B. Pembatalan atau kegagalan oleh Vendor")).toBeTruthy();
    expect(screen.getByText("1.1.2")).toBeTruthy();
    expect(screen.getByText("Hak customer tetap mengikuti dokumen asli.")).toBeTruthy();
    for (const value of document.content[2].rows!.slice(1).flat())
      expect(screen.getByText(value)).toBeTruthy();
    expect(screen.getAllByText("Keadaan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hak Customer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Column 3").length).toBeGreaterThan(0);
  });
}

test("updated terms cannot be dismissed or bypassed and require consent for each version", async () => {
  mockPendingTerms = [pendingTerms(1), pendingTerms(2)];
  await render(
    <ConsentGate>
      <Text>Protected content</Text>
    </ConsentGate>,
  );
  await screen.findByText("Document body 1");
  expect(screen.queryByText("Protected content")).toBeNull();
  expect(screen.queryByRole("button", { name: "Close terms and conditions" })).toBeNull();
  await fireEvent(screen.getByTestId("terms-dialog"), "requestClose");
  expect(screen.getByText("Document body 1")).toBeTruthy();
  const accept = screen.getByRole("button", { name: "Accept and continue" });
  expect(accept).toBeDisabled();
  await fireEvent.press(
    screen.getByRole("checkbox", {
      name: "I have read and agree to the latest terms and conditions.",
    }),
  );
  await fireEvent.press(accept);
  await screen.findByText("Document body 2");
  expect(screen.getByRole("button", { name: "Accept and continue" })).toBeDisabled();
  await fireEvent.press(
    screen.getByRole("checkbox", {
      name: "I have read and agree to the latest terms and conditions.",
    }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Accept and continue" }));
  await screen.findByText("Protected content");
  expect(
    mockCalls.filter((call) => call.path === "/terms/accept").map((call) => call.body),
  ).toEqual([{ termsVersionId: 1 }, { termsVersionId: 2 }]);
});

test("users can sign out of mandatory updated terms without accepting them", async () => {
  mockPendingTerms = [pendingTerms(1)];
  await render(
    <ConsentGate>
      <Text>Protected content</Text>
    </ConsentGate>,
  );
  await fireEvent.press(await screen.findByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
  expect(mockCalls.filter((call) => call.method !== "GET")).toHaveLength(0);
});

test("failed acceptance keeps the dialog blocking protected content and never retries automatically", async () => {
  mockPendingTerms = [pendingTerms(1)];
  mockTermsAcceptFailure = 503;
  await render(
    <ConsentGate>
      <Text>Protected content</Text>
    </ConsentGate>,
  );
  await fireEvent.press(
    await screen.findByRole("checkbox", {
      name: "I have read and agree to the latest terms and conditions.",
    }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Accept and continue" }));
  await screen.findByText("The request failed. Check your entries and try again.");
  expect(screen.queryByText("Protected content")).toBeNull();
  expect(mockCalls.filter((call) => call.path === "/terms/accept")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Accept and continue" })).toBeEnabled();
});

test("outdated terms reload the latest document and clear consent before another acceptance", async () => {
  mockPendingTerms = [pendingTerms(1)];
  mockTermsAcceptFailure = 409;
  await render(
    <ConsentGate>
      <Text>Protected content</Text>
    </ConsentGate>,
  );
  await fireEvent.press(
    await screen.findByRole("checkbox", {
      name: "I have read and agree to the latest terms and conditions.",
    }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Accept and continue" }));
  await screen.findByText("Document body 2");
  expect(screen.getByRole("button", { name: "Accept and continue" })).toBeDisabled();
  expect(mockCalls.filter((call) => call.path === "/terms/accept")).toHaveLength(1);
});

test("a missing wedding profile does not hide orders and offers profile completion", async () => {
  mockProfileStatus = 404;
  await render(<DashboardScreen />);
  await screen.findByText("PYW-TEST-101");
  await fireEvent.press(
    await screen.findByRole("button", { name: "Complete your wedding profile" }),
  );
  expect(mockNavigate).toHaveBeenCalledWith({ pathname: "/page", params: { kind: "profile" } });
});

test("wedding profile errors remain retryable while the order summary is available", async () => {
  mockProfileStatus = 503;
  await render(<DashboardScreen />);
  await screen.findByText("PYW-TEST-101");
  const retry = await screen.findByRole("button", { name: "Try again" });
  mockProfileStatus = 200;
  await fireEvent.press(retry);
  await screen.findByText("Gedung UBL");
  expect(mockCalls.every((call) => call.method === "GET")).toBe(true);
});
test("vendor confirmation asks for approval and sends one status mutation", async () => {
  mockRole = "VENDOR";
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await render(<OrderScreen id="101" />);
  await screen.findByText("PYW-TEST-101");
  await fireEvent.press(screen.getByRole("button", { name: "Confirm order" }));
  expect(mockCalls.filter((call) => call.method !== "GET")).toHaveLength(0);
  const buttons = alert.mock.calls[0][2];
  await act(async () => {
    buttons?.find((button) => button.text === "Confirm")?.onPress?.();
  });
  await screen.findByRole("button", { name: "Start work" });
  expect(mockCalls.filter((call) => call.path.endsWith("/confirm"))).toHaveLength(1);
  alert.mockRestore();
});
test("checkout waits for availability and sends numeric IDs and original payment enums", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await render(<CheckoutScreen id="10" />);
  await screen.findByText("Rangga");
  expect(screen.getByRole("button", { name: "Create order" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Check availability" }));
  await screen.findByText("Available");
  expect(screen.getByRole("button", { name: "Create order" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Create order" }));
  await act(async () => {
    alert.mock.calls[0][2]?.find((button) => button.text === "Confirm")?.onPress?.();
  });
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/page",
      params: { kind: "order", id: "102" },
    }),
  );
  expect(mockCalls.find((call) => call.path === "/orders" && call.method === "POST")?.body).toEqual(
    {
      vendorProductId: 10,
      eventDate: "2027-10-24",
      eventLocation: "Gedung UBL",
      guestCount: 1000,
      paymentType: "FULL",
    },
  );
  alert.mockRestore();
});

test("admin payment review works without a parent order reference and confirms one verification", async () => {
  mockRole = "ADMIN";
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await render(<PaymentsScreen id="201" />);
  await screen.findByRole("button", { name: "Approve payment" });
  await fireEvent.press(screen.getByRole("button", { name: "Approve payment" }));
  expect(mockCalls.filter((call) => call.method === "PUT")).toHaveLength(0);
  await act(async () => {
    alert.mock.calls[0][2]?.find((button) => button.text === "Confirm")?.onPress?.();
  });
  await screen.findByText("Paid");
  expect(mockCalls.filter((call) => call.path.endsWith("/verify"))).toHaveLength(1);
  alert.mockRestore();
});

test("admin vendor rejection requires a reason and preserves the rejection payload", async () => {
  mockRole = "ADMIN";
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await render(<VendorDetailScreen id="2" />);
  await screen.findByText("Video Keren");
  await fireEvent.press(screen.getByRole("button", { name: "Reject vendor" }));
  expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText("Reason"), " Missing document ");
  await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
  await act(async () => {
    alert.mock.calls[0][2]?.find((button) => button.text === "Confirm")?.onPress?.();
  });
  await waitFor(() => expect(mockCalls.some((call) => call.path.endsWith("/reject"))).toBe(true));
  expect(mockCalls.find((call) => call.path.endsWith("/reject"))?.body).toEqual({
    rejectReason: "Missing document",
  });
  alert.mockRestore();
});

test("editing a task preserves automatic deadlines and uses the existing subtask completion rule", async () => {
  await render(<TaskScreen id="task-1" />);
  await screen.findByDisplayValue("Family plan");
  await fireEvent(screen.getByLabelText("Status"), "valueChange", "COMPLETED");
  await fireEvent.press(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith({ pathname: "/page", params: { kind: "planning" } }),
  );
  const payload = mockCalls.find(
    (call) => call.path.endsWith("/task-1") && call.method === "PUT",
  )?.body;
  expect(payload).toMatchObject({
    status: "COMPLETED",
    customDue: false,
    subtasks: [{ title: "Choose date", done: true }],
  });
});

test("planning preferences never send server-owned fields back in an update", async () => {
  await render(<PlanningSettingsScreen />);
  await screen.findByRole("button", { name: "Save" });
  await fireEvent.press(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(mockCalls.some((call) => call.path === "/wedding-plans" && call.method === "PUT")).toBe(
      true,
    ),
  );
  expect(
    mockCalls.find((call) => call.path === "/wedding-plans" && call.method === "PUT")?.body,
  ).toEqual({ traditional: false, outdoor: false, useWo: false, autoReschedule: true });
});
