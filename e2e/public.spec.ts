import { test, expect, json } from "./fixtures";

for (const locale of ["id", "en"] as const) {
  test(`public pages, registration and 404 use ${locale}`, async ({ page, context }) => {
    await context.addCookies([{ name: "pyw-locale", value: locale, url: "http://127.0.0.1:3107" }]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      locale === "en" ? "Your special day" : "Hari istimewa",
    );
    await page.goto("/register/customer");
    await expect(
      page.getByRole("button", { name: locale === "en" ? "Sign up now" : "Daftar sekarang" }),
    ).toBeDisabled();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await page.goto("/missing-page-test");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      locale === "en" ? "Page not found" : "Halaman tidak ditemukan",
    );
    await page
      .getByRole("link", { name: locale === "en" ? "Back to home" : "Kembali ke beranda" })
      .click();
    await expect(page).toHaveURL("/");
  });
}

test("switching language preserves a form draft and persists after reload", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill("draft@example.com");
  await page.locator('input[name="password"]').fill("DraftPassword1!");
  await page.getByRole("button", { name: "Ganti ke bahasa Inggris" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back");
  await expect(page.locator('input[name="email"]')).toHaveValue("draft@example.com");
  await expect(page.locator('input[name="password"]')).toHaveValue("DraftPassword1!");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back");
});

test("a failed locale download preserves the current language and form draft, then allows retry", async ({
  page,
}) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill("draft@example.com");
  await page.route("**/_next/static/chunks/**", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Ganti ke bahasa Inggris" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Bahasa belum dapat dimuat" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.locator('input[name="email"]')).toHaveValue("draft@example.com");
  await page.unroute("**/_next/static/chunks/**");
  await page.getByRole("button", { name: "Ganti ke bahasa Inggris" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back");
  await expect(page.locator('input[name="email"]')).toHaveValue("draft@example.com");
});

test("login failure is translated and allows a second attempt", async ({ page, context }) => {
  await context.addCookies([{ name: "pyw-locale", value: "en", url: "http://127.0.0.1:3107" }]);
  await page.route("**/backend-api/cryptography/encrypt", (route) =>
    json(route, { cipherText: "fixture-cipher" }),
  );
  let attempts = 0;
  await page.route("**/backend-api/auth/login", (route) => {
    attempts++;
    return json(route, { message: "Invalid credentials" }, 401);
  });
  await page.goto("/login");
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.locator('input[name="password"]').fill("Password1!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Incorrect email or password.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close popup" }).click();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => attempts).toBe(2);
});

test("protected pages redirect unauthenticated visitors to login", async ({ page }) => {
  for (const role of ["customer", "vendor", "admin"]) {
    await page.goto(`/${role}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=%2F${role}%2Fdashboard`));
  }
});

test("successful login stores the session and navigates to the correct role", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "pyw-locale", value: "en", url: "http://127.0.0.1:3107" }]);
  const payload = Buffer.from(JSON.stringify({ exp: 4102444800 })).toString("base64url");
  const token = `fixture.${payload}.signature`;
  await page.route("**/backend-api/cryptography/encrypt", (route) =>
    json(route, { cipherText: "fixture-cipher" }),
  );
  await page.route("**/backend-api/auth/login", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "test@example.com",
      password: "fixture-cipher",
    });
    await json(route, {
      access_token: token,
      user: { id: 1, email: "test@example.com", fullname: "Test Customer", isEmailVerified: true },
      roles: { id: 1, roleName: "CUSTOMER" },
      listRoles: [],
    });
  });
  await page.goto("/login");
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.locator('input[name="password"]').fill("Password1!");
  await page.locator('input[name="rememberMe"]').check();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/customer/dashboard");
  expect((await context.cookies()).find((cookie) => cookie.name === "pyw_role")?.value).toBe(
    "CUSTOMER",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("pyw_auth_session") ?? "{}").accessToken,
    ),
  ).toBe(token);
});

test("customer registration preserves consent and advances through OTP verification", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "pyw-locale", value: "en", url: "http://127.0.0.1:3107" }]);
  await page.route("**/backend-api/cryptography/encrypt", (route) =>
    json(route, { cipherText: "fixture-cipher" }),
  );
  let registrations = 0;
  await page.route("**/backend-api/register/customer", async (route) => {
    registrations++;
    expect(route.request().postDataJSON()).toMatchObject({
      acceptedTerms: true,
      termsVersionId: 1,
      password: "fixture-cipher",
      confirmPassword: "fixture-cipher",
    });
    await json(route, {
      user: { id: 1, fullname: "Test Customer", email: "test@example.com" },
      profile: {},
    });
  });
  await page.route("**/backend-api/auth/verify-otp", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      purpose: "register",
      otpCode: "123456",
    });
    await json(route, { verified: true, purpose: "register", email: "test@example.com" });
  });
  await page.goto("/register/customer");
  await page.locator('input[name="fullname"]').fill("Test Customer");
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.locator('input[name="phoneNumber"]').fill("081234567890");
  await page.locator('input[name="password"]').fill("Password1!");
  await page.locator('input[name="confirmPassword"]').fill("Password1!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Sign up now", exact: true }).click();
  await page.locator('input[name="otpCode"]').fill("123456");
  await page.getByRole("button", { name: "Verify OTP", exact: true }).click();
  await expect(
    page.getByText("Email verified. Your account is ready.", { exact: true }),
  ).toBeVisible();
  expect(registrations).toBe(1);
});

test("password reset advances only after OTP verification and sends matching encrypted passwords", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "pyw-locale", value: "en", url: "http://127.0.0.1:3107" }]);
  await page.route("**/backend-api/auth/forgot-password", (route) =>
    json(route, { sent: true, purpose: "forgot_password", email: "test@example.com" }),
  );
  await page.route("**/backend-api/auth/verify-otp", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      purpose: "forgot_password",
      otpCode: "123456",
    });
    await json(route, { verified: true, purpose: "forgot_password", email: "test@example.com" });
  });
  await page.route("**/backend-api/cryptography/encrypt", (route) =>
    json(route, { cipherText: "fixture-cipher" }),
  );
  let changes = 0;
  await page.route("**/backend-api/auth/change-password", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "test@example.com",
      newPassword: "fixture-cipher",
      confirmNewPassword: "fixture-cipher",
    });
    changes++;
    await json(route, { changed: true });
  });
  await page.goto("/forgot-password");
  await expect(page.locator('input[name="newPassword"]')).toHaveCount(0);
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.getByRole("button", { name: "Send OTP code", exact: true }).click();
  await page.locator('input[name="otpCode"]').fill("123456");
  await page.getByRole("button", { name: "Verify OTP", exact: true }).click();
  await page.locator('input[name="newPassword"]').fill("NewPassword1!");
  await page.locator('input[name="confirmNewPassword"]').fill("NewPassword1!");
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await expect(
    page.getByText("Password changed. Sign in with your new password.", { exact: true }),
  ).toBeVisible();
  expect(changes).toBe(1);
});
