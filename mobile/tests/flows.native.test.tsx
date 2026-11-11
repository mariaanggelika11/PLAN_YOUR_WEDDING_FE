import React from "react";
import { Alert, Dimensions } from "react-native";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import i18n from "i18next";
import { createApi } from "../src/api/client";
import { languageReady } from "../src/i18n";
import { AuthScreen } from "../src/screens/AuthScreen";
import { LandingScreen } from "../src/screens/LandingScreen";
import { NavigationShell, WorkspaceHeader } from "../src/components/NavigationChrome";
import { DashboardScreen } from "../src/screens/DashboardScreen";
import { MoreScreen } from "../src/screens/MoreScreen";
import { OrderScreen, PaymentsScreen } from "../src/screens/OrderScreens";
import { TaskScreen, PlanningSettingsScreen } from "../src/screens/PlanningScreens";
import { VendorDetailScreen } from "../src/screens/AdminScreens";
import { CheckoutScreen } from "../src/screens/ProductScreens";
import type { Order, Role, Session } from "../src/domain/contracts";
import { canVisit } from "../src/navigation";

let mockRole: Role = "CUSTOMER";
let mockOrderStatus: Order["status"] = "WAITING_VENDOR_CONFIRMATION";
let mockPaymentStatus = "WAITING_VERIFICATION";
let mockVendorStatus = 2;
let mockProfileStatus = 200;
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

for (const mode of ["customer", "vendor"] as const) {
  test(`direct ${mode} registration retains mandatory terms consent`, async () => {
    await render(<AuthScreen initialFlow={mode} />);
    await screen.findByText("Fixture terms body");
    expect(screen.getByLabelText(mode === "customer" ? "Full name" : "Business name")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
    expect(mockCalls.filter((call) => call.method !== "GET")).toHaveLength(0);
  });
}

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
