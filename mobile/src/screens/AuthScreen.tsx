import React, { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { ArrowRight, Check, Heart, ShieldCheck, Store } from "lucide-react-native";
import { useAuth } from "../auth/Provider";
import { signIn, register, encryptPassword } from "../api/auth";
import { ApiError, jsonBody } from "../api/client";
import { passwordPattern } from "../domain/rules";
import type { TermsDocument } from "../domain/contracts";
import { useI18n } from "../i18n";
import {
  Button,
  Card,
  Feedback,
  Field,
  H1,
  P,
  Screen,
  Toggle,
  styles,
  Loading,
  colors,
} from "../components/ui";
import { PublicHeader } from "../components/NavigationChrome";
import { Terms } from "../components/Terms";
import { useAction } from "../components/hooks";

type Flow = "login" | "customer" | "vendor" | "reset" | "verify" | "newPassword";
export function AuthScreen({
  initialFlow = "login",
}: {
  initialFlow?: "login" | "customer" | "vendor";
}) {
  const { api, authenticate, storageError, retryStorage } = useAuth();
  const { t } = useI18n();
  const { width, fontScale } = useWindowDimensions();
  const action = useAction();
  const [flow, setFlow] = useState<Flow>(initialFlow);
  const [purpose, setPurpose] = useState<"register" | "forgot_password">("register");
  const [values, setValues] = useState<Record<string, string>>({});
  const [remember, setRemember] = useState(true);
  const [consent, setConsent] = useState(false);
  const [terms, setTerms] = useState<TermsDocument | null>(null);
  const [termsError, setTermsError] = useState<unknown>(null);
  const [termsAttempt, setTermsAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  const update = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (flow !== "customer" && flow !== "vendor") return;
    let live = true;
    setConsent(false);
    setTerms(null);
    setTermsError(null);
    void api<TermsDocument>(`/terms/active/${flow}`, {}, false)
      .then((document) => {
        if (
          !document.isActive ||
          document.termsType.toLowerCase() !== flow ||
          !document.content?.length
        )
          throw new Error("TERMS_OUTDATED");
        if (live) setTerms(document);
      })
      .catch((error) => {
        if (live) setTermsError(error);
      });
    return () => {
      live = false;
    };
  }, [api, flow, termsAttempt]);
  function move(next: Flow) {
    setFlow(next);
    action.clear();
    setNotice("");
    setValues((current) => ({ email: current.email ?? "" }));
  }
  const labels: Record<string, string> = {
    fullname: "Full name",
    ownerName: "Owner name",
    businessName: "Business name",
    phoneNumber: "Phone number",
    businessPhone: "Business phone",
    businessAddress: "Business address",
    email: "Email",
    password: flow === "newPassword" ? "New password" : "Password",
    confirmPassword: "Confirm password",
    otpCode: "Verification code",
  };
  const fields =
    flow === "login"
      ? ["email", "password"]
      : flow === "customer"
        ? ["fullname", "email", "phoneNumber", "password", "confirmPassword"]
        : flow === "vendor"
          ? [
              "ownerName",
              "businessName",
              "email",
              "businessPhone",
              "businessAddress",
              "password",
              "confirmPassword",
            ]
          : flow === "verify"
            ? ["otpCode"]
            : flow === "newPassword"
              ? ["password", "confirmPassword"]
              : ["email"];
  const title =
    flow === "login"
      ? "Welcome back"
      : flow === "customer" || flow === "vendor"
        ? "Create account"
        : flow === "verify"
          ? "Verify OTP"
          : "Reset password";
  async function submit() {
    await action.run(async () => {
      if (fields.some((key) => !values[key]?.trim())) throw new Error("REQUIRED");
      if (flow === "login") {
        try {
          await authenticate(await signIn(api, values.email, values.password), remember);
        } catch (error) {
          if (error instanceof ApiError && error.status === 401)
            throw new Error("CREDENTIALS_INVALID");
          if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
            const result = await api<{ sent: boolean }>(
              "/auth/resend-otp",
              jsonBody({ email: values.email.trim().toLowerCase(), purpose: "register" }),
              false,
            );
            if (!result.sent) throw new Error("REQUEST_FAILED");
            setPurpose("register");
            setFlow("verify");
            setNotice("A verification code has been sent to your email.");
            return;
          }
          throw error;
        }
      } else if (flow === "customer" || flow === "vendor") {
        if (!consent || !terms) throw new Error("TERMS_ACCEPTANCE_REQUIRED");
        await register(api, flow, values, terms);
        setValues({ email: values.email });
        setPurpose("register");
        setFlow("verify");
        setNotice("A verification code has been sent to your email.");
      } else if (flow === "reset") {
        const result = await api<{ sent: boolean }>(
          "/auth/forgot-password",
          jsonBody({ email: values.email.trim().toLowerCase() }),
          false,
        );
        if (!result.sent) throw new Error("REQUEST_FAILED");
        setPurpose("forgot_password");
        setFlow("verify");
        setNotice("A verification code has been sent to your email.");
      } else if (flow === "verify") {
        const result = await api<{ verified: boolean }>(
          "/auth/verify-otp",
          jsonBody({
            email: values.email.trim().toLowerCase(),
            otpCode: values.otpCode.trim(),
            purpose,
          }),
          false,
        );
        if (!result.verified) throw new Error("REQUEST_FAILED");
        setValues({ email: values.email });
        setFlow(purpose === "forgot_password" ? "newPassword" : "login");
        setNotice(purpose === "register" ? "Email verified. Please sign in." : "");
      } else {
        if (!passwordPattern.test(values.password)) throw new Error("PASSWORD_INVALID");
        if (values.password !== values.confirmPassword) throw new Error("PASSWORD_MISMATCH");
        const password = await encryptPassword(api, values.password);
        const result = await api<{ changed: boolean }>(
          "/auth/change-password",
          jsonBody({
            email: values.email.trim().toLowerCase(),
            newPassword: password,
            confirmNewPassword: password,
          }),
          false,
        );
        if (!result.changed) throw new Error("REQUEST_FAILED");
        setValues({ email: values.email });
        setFlow("login");
        setNotice("Password changed. Please sign in.");
      }
    });
  }
  return (
    <View style={styles.screen}>
      <PublicHeader back />
      <Screen contentStyle={{ paddingTop: 28 }}>
        <View
          style={{
            flexDirection: width >= 900 ? "row" : "column",
            gap: 32,
            alignItems: "flex-start",
          }}
        >
          {width >= 900 && (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.ink,
                borderRadius: 20,
                padding: 32,
                gap: 24,
                minHeight: 430,
              }}
            >
              <Heart size={32} color="#E4B8C4" />
              <Text style={{ color: "white", fontSize: 34, lineHeight: 43, fontWeight: "700" }}>
                {t("A special day. A well-organized plan.")}
              </Text>
              <Text style={{ color: "#E7E5E4", fontSize: 16, lineHeight: 26 }}>
                {t("One place to find vendors, manage orders, and plan your wedding.")}
              </Text>
              <View style={[styles.row, { marginTop: "auto" }]}>
                <ShieldCheck color="#E4B8C4" size={18} />
                <Text style={{ color: "#E7E5E4", flex: 1, fontSize: 13 }}>
                  {t("Celebrate with confidence")}
                </Text>
              </View>
            </View>
          )}
          <View
            style={{
              width: "100%",
              maxWidth: 480,
              flex: width >= 900 ? 1 : undefined,
              alignSelf: "center",
              gap: 20,
            }}
          >
            <View style={{ gap: 8 }}>
              <Text style={[styles.label, { color: colors.primary }]}>
                {t("Celebrate with confidence")}
              </Text>
              <H1>{t(title)}</H1>
              <P muted>
                {t(
                  flow === "login"
                    ? "Sign in to continue planning your special day."
                    : flow === "customer"
                      ? "I'm planning a wedding"
                      : flow === "vendor"
                        ? "I offer wedding services"
                        : "Plan your special day with confidence.",
                )}
              </P>
            </View>
            {notice ? (
              <Card>
                <P>{t(notice)}</P>
              </Card>
            ) : null}
            {storageError && <Feedback error={new Error("STORAGE_ERROR")} retry={retryStorage} />}
            <Card style={{ padding: 20, gap: 18 }}>
              {fields.map((key) => (
                <Field
                  key={key}
                  label={t(labels[key])}
                  required
                  value={values[key] ?? ""}
                  onChangeText={(value) => update(key, value)}
                  secureTextEntry={key.toLowerCase().includes("password")}
                  autoCapitalize={
                    key === "email" || key.toLowerCase().includes("password") ? "none" : "words"
                  }
                  autoCorrect={false}
                  keyboardType={
                    key === "email"
                      ? "email-address"
                      : ["phoneNumber", "businessPhone"].includes(key)
                        ? "phone-pad"
                        : key === "otpCode"
                          ? "number-pad"
                          : "default"
                  }
                  textContentType={
                    key === "password"
                      ? flow === "login"
                        ? "password"
                        : "newPassword"
                      : key === "email"
                        ? "emailAddress"
                        : key === "otpCode"
                          ? "oneTimeCode"
                          : undefined
                  }
                />
              ))}
              {flow === "login" && (
                <View
                  style={{
                    flexDirection: width < 360 || fontScale > 1.2 ? "column" : "row",
                    justifyContent: "space-between",
                    alignItems: width < 360 || fontScale > 1.2 ? "stretch" : "center",
                    gap: 4,
                  }}
                >
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={t("Remember me")}
                    accessibilityState={{ checked: remember }}
                    onPress={() => setRemember((value) => !value)}
                    style={{
                      flex: width < 360 || fontScale > 1.2 ? undefined : 1,
                      minHeight: 48,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 19,
                        height: 19,
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: remember ? colors.primary : "#A8A29E",
                        backgroundColor: remember ? colors.primary : colors.paper,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {remember && <Check size={14} color="white" />}
                    </View>
                    <Text style={[styles.muted, { flexShrink: 1 }]}>{t("Remember me")}</Text>
                  </Pressable>
                  <Button
                    title={t("Forgot password?")}
                    variant="text"
                    onPress={() => move("reset")}
                    style={{ paddingHorizontal: 0, alignSelf: "flex-start" }}
                  />
                </View>
              )}
              {(flow === "customer" || flow === "vendor") && (
                <>
                  <P muted>{t("Read the terms before continuing.")}</P>
                  {terms ? (
                    <Terms document={terms} />
                  ) : termsError ? (
                    <Feedback
                      error={termsError}
                      retry={() => setTermsAttempt((value) => value + 1)}
                    />
                  ) : (
                    <Loading />
                  )}
                  <Toggle
                    label={t("I agree to the terms and conditions")}
                    value={consent}
                    onChange={setConsent}
                  />
                </>
              )}
              <Feedback error={action.error} />
              <Button
                title={t(
                  flow === "login"
                    ? "Sign in"
                    : flow === "verify"
                      ? "Verify OTP"
                      : flow === "reset"
                        ? "Send verification code"
                        : flow === "newPassword"
                          ? "Reset password"
                          : "Create account",
                )}
                busy={action.busy}
                disabled={(flow === "customer" || flow === "vendor") && (!consent || !terms)}
                onPress={() => void submit()}
              />
              {flow !== "login" && (
                <Button title={t("Back")} variant="text" onPress={() => move("login")} />
              )}
              {flow === "verify" && (
                <Button
                  title={t("Resend code")}
                  variant="text"
                  busy={action.busy}
                  onPress={() =>
                    void action.run(async () => {
                      const result = await api<{ sent: boolean }>(
                        "/auth/resend-otp",
                        jsonBody({ email: values.email.trim().toLowerCase(), purpose }),
                        false,
                      );
                      if (!result.sent) throw new Error("REQUEST_FAILED");
                      setNotice("A verification code has been sent to your email.");
                    })
                  }
                />
              )}
            </Card>
            {flow === "login" && (
              <View style={{ gap: 12 }}>
                <P muted>{t("New to Plan Your Wedding?")}</P>
                {(
                  [
                    ["customer", Heart, "Customer", "I'm planning a wedding"],
                    ["vendor", Store, "Vendor", "I offer wedding services"],
                  ] as const
                ).map(([next, Icon, label, description]) => (
                  <Pressable
                    key={next}
                    accessibilityRole="button"
                    accessibilityLabel={t(label)}
                    onPress={() => move(next)}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 14,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.soft,
                      }}
                    >
                      <Icon color={colors.primary} size={20} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.label}>{t(label)}</Text>
                      <Text style={styles.muted}>{t(description)}</Text>
                    </View>
                    <ArrowRight size={17} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </Screen>
    </View>
  );
}
