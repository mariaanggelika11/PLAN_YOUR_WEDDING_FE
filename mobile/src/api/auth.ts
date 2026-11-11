import type { Api } from "./client";
import { jsonBody } from "./client.ts";
import type { Session, TermsDocument } from "../domain/contracts";
import { passwordPattern, primaryRole } from "../domain/rules.ts";

export async function encryptPassword(api: Api, password: string) {
  const data = await api<{ cipherText: string }>(
    "/cryptography/encrypt",
    jsonBody({ plainText: password }),
    false,
  );
  if (!data.cipherText) throw new Error("INVALID_RESPONSE");
  return data.cipherText;
}
export async function signIn(api: Api, email: string, password: string): Promise<Session> {
  const cipherText = await encryptPassword(api, password);
  const data = await api<{
    access_token: string;
    user: { id: number; fullname: string; email: string; isEmailVerified: boolean };
    roles?: { roleName: string };
  }>("/auth/login", jsonBody({ email: email.trim().toLowerCase(), password: cipherText }), false);
  if (!data.user?.isEmailVerified) throw new Error("EMAIL_NOT_VERIFIED");
  if (!data.access_token) throw new Error("INVALID_RESPONSE");
  let expiresAt: number | undefined;
  try {
    const encoded = data.access_token.split(".")[1];
    const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
    if (Number.isFinite(payload.exp)) expiresAt = payload.exp * 1000;
  } catch {
    /* Opaque tokens are supported by the backend. */
  }
  return {
    accessToken: data.access_token,
    user: {
      id: data.user.id,
      name: data.user.fullname,
      email: data.user.email,
      role: primaryRole(data.roles?.roleName),
    },
    expiresAt,
  };
}
export async function register(
  api: Api,
  kind: "customer" | "vendor",
  values: Record<string, string>,
  terms: TermsDocument,
) {
  if (!passwordPattern.test(values.password)) throw new Error("PASSWORD_INVALID");
  if (values.password !== values.confirmPassword) throw new Error("PASSWORD_MISMATCH");
  if (!terms.isActive || terms.termsType.toLowerCase() !== kind || !terms.content?.length)
    throw new Error("TERMS_OUTDATED");
  const password = await encryptPassword(api, values.password);
  const fields =
    kind === "customer"
      ? ["fullname", "phoneNumber"]
      : ["ownerName", "businessName", "businessPhone", "businessAddress"];
  const profile = Object.fromEntries(fields.map((field) => [field, values[field]?.trim()]));
  return api(
    `/register/${kind}`,
    jsonBody({
      ...profile,
      email: values.email.trim().toLowerCase(),
      password,
      confirmPassword: password,
      acceptedTerms: true,
      termsVersionId: terms.id,
    }),
    false,
  );
}
