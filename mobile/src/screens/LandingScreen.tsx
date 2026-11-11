import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowRight,
  CalendarHeart,
  CheckCheck,
  Heart,
  ShieldCheck,
  Store,
} from "lucide-react-native";
import { PublicHeader, type PublicSection } from "../components/NavigationChrome";
import { Brand, Button, Card, H2, P, colors, styles } from "../components/ui";
import { useI18n } from "../i18n";

export function LandingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { section } = useLocalSearchParams<{ section?: PublicSection }>();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [anchors, setAnchors] = useState<Partial<Record<PublicSection, number>>>({});
  const roomy = width >= 700;
  const jump = (value: PublicSection) =>
    scroll.current?.scrollTo({ y: anchors[value] ?? 0, animated: false });
  useEffect(() => {
    if (section && anchors[section] !== undefined)
      scroll.current?.scrollTo({ y: anchors[section], animated: false });
  }, [section, anchors]);
  const register = (mode: "customer" | "vendor") =>
    router.push({ pathname: "/auth", params: { mode } });
  return (
    <View style={styles.screen}>
      <PublicHeader onSection={jump} />
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={landing.hero}>
          <Image
            source={require("../../assets/landing-wedding.jpg")}
            accessible={false}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1C1917B8" }]} />
          <View style={[landing.container, { paddingVertical: roomy ? 76 : 42, gap: 20 }]}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <ShieldCheck color="#F1D7A3" size={18} />
              <Text style={landing.eyebrow}>{t("Trusted wedding marketplace in Indonesia")}</Text>
            </View>
            <Text
              accessibilityRole="header"
              style={[
                landing.headline,
                { fontSize: roomy ? 46 : 32, lineHeight: roomy ? 55 : 40, maxWidth: 720 },
              ]}
            >
              {t("Your special day starts with a plan that feels easy.")}
            </Text>
            <Text style={[landing.lightText, { maxWidth: 620 }]}>
              {t(
                "Find verified vendors, compare packages, manage your budget, and track your wedding preparations in one place.",
              )}
            </Text>
            <View style={[styles.row, { marginTop: 6, alignItems: "stretch" }]}>
              <Button
                title={t("Explore vendor packages")}
                icon={<ArrowRight size={18} color="white" />}
                onPress={() => router.push("/auth")}
                style={roomy ? {} : { width: "100%" }}
              />
              <Button
                title={t("How it works")}
                variant="onDark"
                onPress={() => jump("how")}
                style={roomy ? {} : { width: "100%" }}
              />
            </View>
          </View>
        </View>
        <View
          onLayout={({ nativeEvent }) => setAnchors((a) => ({ ...a, how: nativeEvent.layout.y }))}
          style={[landing.container, landing.section]}
        >
          <View style={{ gap: 8 }}>
            <Text style={landing.kicker}>{t("How it works")}</Text>
            <Text accessibilityRole="header" style={landing.sectionTitle}>
              {t("A little calmer at every step")}
            </Text>
            <P muted>{t("A simple journey from your first idea to your wedding day.")}</P>
          </View>
          <View style={{ flexDirection: roomy ? "row" : "column", gap: 14 }}>
            {(
              [
                [
                  CalendarHeart,
                  "Tell us about your dream wedding",
                  "Set your date, location, theme, and estimated budget.",
                ],
                [
                  ShieldCheck,
                  "Choose vendors with confidence",
                  "Compare verified vendors, packages, prices, and real reviews.",
                ],
                [
                  CheckCheck,
                  "Keep everything in one place",
                  "Manage bookings, payments, your budget, and preparation progress.",
                ],
              ] as const
            ).map(([Icon, title, description], index) => (
              <Card key={title} style={{ flex: roomy ? 1 : undefined, padding: 20, gap: 14 }}>
                <View style={[styles.row, { justifyContent: "space-between" }]}>
                  <View style={landing.iconTile}>
                    <Icon size={22} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 12, letterSpacing: 2, color: colors.muted }}>
                    0{index + 1}
                  </Text>
                </View>
                <H2>{t(title)}</H2>
                <P muted>{t(description)}</P>
              </Card>
            ))}
          </View>
        </View>
        <View
          onLayout={({ nativeEvent }) => setAnchors((a) => ({ ...a, about: nativeEvent.layout.y }))}
          style={{ backgroundColor: colors.ink }}
        >
          <View style={[landing.container, landing.section, { gap: 14 }]}>
            <Text style={[landing.kicker, { color: "#E4B8C4" }]}>{t("About")}</Text>
            <Text accessibilityRole="header" style={[landing.sectionTitle, { color: "white" }]}>
              {t("Wedding preparations, together in one place")}
            </Text>
            <Text style={[landing.lightText, { maxWidth: 680 }]}>
              {t(
                "Compare vendor packages, track orders and payments, and organize tasks around your event.",
              )}
            </Text>
          </View>
        </View>
        <View
          onLayout={({ nativeEvent }) => setAnchors((a) => ({ ...a, start: nativeEvent.layout.y }))}
          style={[landing.container, landing.section]}
        >
          <View style={{ gap: 8 }}>
            <Text style={landing.kicker}>{t("Start your journey")}</Text>
            <Text accessibilityRole="header" style={landing.sectionTitle}>
              {t("Make room for your special day")}
            </Text>
            <P muted>{t("Choose the space that fits your needs.")}</P>
          </View>
          <View style={{ flexDirection: roomy ? "row" : "column", gap: 16 }}>
            <Card
              style={{
                flex: roomy ? 1 : undefined,
                padding: 22,
                gap: 16,
                backgroundColor: "#FCF4F5",
              }}
            >
              <Heart size={26} color={colors.primary} />
              <Text style={landing.kicker}>{t("For couples")}</Text>
              <H2>{t("Plan your dream wedding")}</H2>
              <P muted>
                {t("Find vendors, manage your budget, book services, and track your preparations.")}
              </P>
              <Button
                title={t("Register as a customer")}
                onPress={() => register("customer")}
                style={{ marginTop: "auto" }}
              />
            </Card>
            <Card style={{ flex: roomy ? 1 : undefined, padding: 22, gap: 16 }}>
              <Store size={26} color={colors.primary} />
              <Text style={landing.kicker}>{t("For wedding businesses")}</Text>
              <H2>{t("Grow your wedding business")}</H2>
              <P muted>
                {t("Show your packages and portfolio, manage orders, and reach more couples.")}
              </P>
              <Button
                title={t("Register as a vendor")}
                variant="secondary"
                onPress={() => register("vendor")}
                style={{ marginTop: "auto" }}
              />
            </Card>
          </View>
        </View>
        <SafeAreaView edges={["bottom"]} style={{ borderTopWidth: 1, borderColor: colors.line }}>
          <View style={[landing.container, { paddingVertical: 24, gap: 10 }]}>
            <Brand tagline />
            <P muted>© {new Date().getFullYear()} Plan Your Wedding</P>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const landing = StyleSheet.create({
  hero: { backgroundColor: colors.ink, overflow: "hidden" },
  container: { width: "100%", maxWidth: 1100, alignSelf: "center", paddingHorizontal: 24 },
  section: { paddingVertical: 36, gap: 24 },
  eyebrow: { flex: 1, color: "#FAEBD2", fontSize: 12, fontWeight: "600", lineHeight: 19 },
  headline: { color: "white", fontWeight: "700", letterSpacing: -0.8 },
  lightText: { color: "#F5F5F4", fontSize: 15, lineHeight: 24 },
  kicker: { color: colors.primary, fontSize: 12, lineHeight: 19, fontWeight: "600" },
  sectionTitle: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 33,
    letterSpacing: -0.4,
    fontWeight: "700",
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.soft,
    justifyContent: "center",
    alignItems: "center",
  },
});
