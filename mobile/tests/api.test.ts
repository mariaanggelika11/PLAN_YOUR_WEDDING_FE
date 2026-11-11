import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, createApi, jsonBody } from "../src/api/client.ts";
import { signIn, register } from "../src/api/auth.ts";

const session = {
  accessToken: "fixture-token",
  user: { id: 1, name: "Test User", email: "test@example.com", role: "CUSTOMER" as const },
};
function client(fetcher: typeof fetch, onUnauthorized = (_token?: string) => {}) {
  return createApi({
    baseUrl: "https://backend.invalid",
    getSession: () => session,
    onUnauthorized,
    fetcher,
  });
}
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ data }), { status });

test("native login uses the website's encryption and login contract and primary role", async () => {
  const requests: { url: string; data: unknown; headers: Headers }[] = [];
  const api = client(async (url, init) => {
    requests.push({
      url: String(url),
      data: JSON.parse(String(init?.body)),
      headers: new Headers(init?.headers),
    });
    return requests.length === 1
      ? response({ cipherText: "encrypted-password" })
      : response({
          access_token: "opaque-token",
          user: { id: 7, fullname: "Owner", email: "owner@example.com", isEmailVerified: true },
          roles: { roleName: "vendor" },
          listRoles: [{ roleName: "ADMIN" }],
        });
  });
  const result = await signIn(api, " Owner@Example.com ", "Password1!");
  assert.equal(result.user.role, "VENDOR");
  assert.deepEqual(
    requests.map((request) => request.data),
    [{ plainText: "Password1!" }, { email: "owner@example.com", password: "encrypted-password" }],
  );
  assert.deepEqual(
    requests.map((request) => request.url),
    ["https://backend.invalid/cryptography/encrypt", "https://backend.invalid/auth/login"],
  );
  assert.equal(requests[1].headers.has("Authorization"), false);
});

test("missing primary roles and unverified emails cannot create a session", async () => {
  for (const verified of [true, false]) {
    const api = client(async (url) =>
      String(url).endsWith("encrypt")
        ? response({ cipherText: "cipher" })
        : response({
            access_token: "token",
            user: { id: 1, isEmailVerified: verified },
            listRoles: [{ roleName: "ADMIN" }],
          }),
    );
    await assert.rejects(signIn(api, "test@example.com", "Password1!"), {
      message: verified ? "UNSUPPORTED_ROLE" : "EMAIL_NOT_VERIFIED",
    });
  }
});

test("registration preserves the accepted terms version and encrypted matching passwords", async () => {
  const bodies: unknown[] = [];
  const api = client(async (url, init) => {
    bodies.push(JSON.parse(String(init?.body)));
    return String(url).endsWith("encrypt")
      ? response({ cipherText: "cipher" })
      : response({ user: { id: 1 } });
  });
  const terms = {
    id: 12,
    termsType: "CUSTOMER" as const,
    isActive: true,
    content: [{ kind: "paragraph" as const, text: "Test terms" }],
    version: "1",
    title: "Terms",
    contentHash: "hash",
    effectiveAt: "2026-01-01",
    createdAt: "2026-01-01",
  };
  await register(
    api,
    "customer",
    {
      fullname: " Test ",
      email: " TEST@example.com ",
      phoneNumber: "08123456",
      password: "Password1!",
      confirmPassword: "Password1!",
    },
    terms,
  );
  assert.deepEqual(bodies[1], {
    fullname: "Test",
    phoneNumber: "08123456",
    email: "test@example.com",
    password: "cipher",
    confirmPassword: "cipher",
    acceptedTerms: true,
    termsVersionId: 12,
  });
  await assert.rejects(
    register(api, "vendor", { password: "Password1!", confirmPassword: "Password1!" }, terms),
    { message: "TERMS_OUTDATED" },
  );
  assert.equal(bodies.length, 2);
});

test("failed native mutations are never retried and raw API messages are not displayed", async () => {
  let calls = 0;
  const api = client(async (_url, init) => {
    calls++;
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer fixture-token");
    assert.equal(init?.body, '{"paymentType":"DP","guestCount":100}');
    return new Response(JSON.stringify({ message: "private@email.com", code: "UNKNOWN" }), {
      status: 500,
    });
  });
  await assert.rejects(
    api("/orders", jsonBody({ paymentType: "DP", guestCount: 100 })),
    (error: unknown) =>
      error instanceof ApiError && error.status === 500 && error.message === "REQUEST_FAILED",
  );
  assert.equal(calls, 1);
});

test("401 invalidates the request's token while 403 keeps the session", async () => {
  const invalidated: (string | undefined)[] = [];
  for (const status of [403, 401]) {
    const api = client(
      async () => new Response("{}", { status }),
      (token) => invalidated.push(token),
    );
    await assert.rejects(
      api("/orders"),
      (error: unknown) => error instanceof ApiError && error.status === status,
    );
  }
  assert.deepEqual(invalidated, ["fixture-token"]);
});

test("timeouts end stalled native requests without retry and caller cancellation stays distinct", async () => {
  let calls = 0;
  const api = createApi({
    baseUrl: "https://backend.invalid",
    getSession: () => session,
    onUnauthorized: () => {},
    timeout: 10,
    fetcher: async (_url, init) => {
      calls++;
      return new Promise<Response>((_resolve, reject) =>
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true }),
      );
    },
  });
  await assert.rejects(api("/orders", { method: "POST" }), { code: "REQUEST_TIMEOUT" });
  assert.equal(calls, 1);
  const controller = new AbortController();
  const promise = api("/orders", { signal: controller.signal });
  controller.abort();
  await assert.rejects(promise, { code: "REQUEST_ABORTED" });
});

test("endpoint validation prevents leaking tokens to a different origin", async () => {
  let calls = 0;
  const api = client(async () => {
    calls++;
    return response({});
  });
  for (const endpoint of ["https://evil.invalid/steal", "//evil.invalid/steal", "/\\evil.invalid"])
    await assert.rejects(api(endpoint), { message: "INVALID_ENDPOINT" });
  assert.equal(calls, 0);
});

test("multipart native uploads keep the generated boundary and original field names", async () => {
  const body = new FormData();
  body.append("proof", new Blob(["test"], { type: "image/png" }), "proof.png");
  const api = client(async (_url, init) => {
    assert.equal(init?.body, body);
    assert.equal(new Headers(init?.headers).has("Content-Type"), false);
    return response({ id: 1 });
  });
  await api("/order-payments/1/proof", { method: "PUT", body });
});

test("already cancelled work never starts a native network request", async () => {
  let calls = 0;
  const controller = new AbortController();
  controller.abort();
  const api = client(async () => {
    calls++;
    return response({});
  });
  await assert.rejects(api("/orders", { signal: controller.signal }), { code: "REQUEST_ABORTED" });
  assert.equal(calls, 0);
});

test("the deadline also covers waiting for a response body", async () => {
  const api = createApi({
    baseUrl: "https://backend.invalid",
    getSession: () => session,
    onUnauthorized: () => {},
    timeout: 10,
    fetcher: async (_url, init) =>
      ({
        ok: true,
        status: 200,
        text: () =>
          new Promise<string>((_resolve, reject) =>
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
              once: true,
            }),
          ),
      }) as Response,
  });
  await assert.rejects(api("/orders"), { code: "REQUEST_TIMEOUT" });
});
