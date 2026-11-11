import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarHeart,
  CheckCheck,
  ChevronRight,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "../auth/Provider";
import { useI18n, money, dateLabel } from "../i18n";
import type { CustomerApiProfile, Dashboard } from "../domain/contracts";
import { ApiError } from "../api/client";
import { useGo, type Kind } from "../navigation";
import { useResource } from "../components/hooks";
import { weddingDaysRemaining } from "../domain/weddingDate";
import {
  Screen,
  H1,
  H2,
  P,
  Card,
  Button,
  Loading,
  Feedback,
  Badge,
  styles,
  colors,
  Empty,
} from "../components/ui";

function WeddingSummary() {
  const { api, session } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const profile = useResource(async () => {
    try {
      return await api<CustomerApiProfile>(`/customer-profile/user/${session!.user.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }, [api, session!.user.id]);
  const data = profile.data;
  const days = weddingDaysRemaining(data?.weddingDate);
  const location = data?.weddingLocation?.trim() || data?.weddingCity?.trim();
  return (
    <Card style={dashboard.wedding}>
      <View style={[styles.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[styles.label, { color: colors.primary }]}>{t("Your wedding")}</Text>
          {profile.loading && !data ? (
            <P muted>{t("Loading")}</P>
          ) : profile.error ? (
            <Feedback error={profile.error} retry={() => void profile.reload()} />
          ) : (
            <>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.ink,
                  fontSize: 21,
                  lineHeight: 29,
                  letterSpacing: -0.4,
                  fontWeight: "700",
                }}
              >
                {t(
                  days === null
                    ? "Set the date for your special day"
                    : days > 0
                      ? "{{count}} days to your special day"
                      : days === 0
                        ? "Your special day is here"
                        : "Your special day has passed",
                  { count: days ?? 0 },
                )}
              </Text>
              <View style={{ gap: 7, marginTop: 4 }}>
                <View style={dashboard.metadata}>
                  <CalendarDays size={15} color={colors.muted} />
                  <Text style={[styles.muted, { flex: 1 }]}>
                    {days === null
                      ? t("Event date not set")
                      : dateLabel(data!.weddingDate!, locale)}
                  </Text>
                </View>
                {location && (
                  <View style={dashboard.metadata}>
                    <MapPin size={15} color={colors.muted} />
                    <Text style={[styles.muted, { flex: 1 }]}>{location}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
        <View style={dashboard.weddingIcon}>
          <CalendarHeart color={colors.primary} size={23} />
        </View>
      </View>
      {!profile.error && (
        <Button
          title={t(days === null ? "Complete your wedding profile" : "Edit wedding details")}
          variant="text"
          onPress={() => go("profile")}
          style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}
          icon={<ArrowUpRight size={16} color={colors.primary} />}
        />
      )}
    </Card>
  );
}

export function DashboardScreen() {
  const { api, session } = useAuth();
  const { t, locale } = useI18n();
  const { width, fontScale } = useWindowDimensions();
  const go = useGo();
  const role = session!.user.role.toLowerCase();
  const resource = useResource(async () => {
    const data = await api<Dashboard>(`/dashboard/summary?role=${role}`);
    if (data.role !== role) throw new Error("INVALID_RESPONSE");
    return data;
  }, [api, role]);
  const data = resource.data;
  const stats: [string, string | number, LucideIcon][] = data
    ? role === "customer"
      ? [
          ["Total orders", data.orders.total, ShoppingBag],
          ["Active orders", data.orders.active ?? 0, CalendarDays],
          ["Vendors booked", data.vendorsBooked ?? 0, Store],
          ["Preparation progress", `${data.tasks?.progressPercent ?? 0}%`, CheckCheck],
        ]
      : role === "vendor"
        ? [
            ["Total orders", data.orders.total, ShoppingBag],
            ["Active products", data.products?.active ?? 0, Package],
            [
              "Monthly revenue",
              money(typeof data.revenue === "object" ? data.revenue.thisMonth : 0, locale),
              Wallet,
            ],
            ["Payments to verify", data.paymentsToVerify ?? 0, ShieldCheck],
          ]
        : [
            ["Users", data.users?.total ?? 0, Users],
            ["Pending vendors", data.vendors?.pendingVerification ?? 0, Store],
            ["Payments to verify", data.paymentsPending ?? 0, Wallet],
            ["Open disputes", data.openDisputes ?? 0, ShieldCheck],
          ]
    : [];
  const shortcuts: [string, Kind, LucideIcon][] =
    role === "customer"
      ? [
          ["Find vendors", "marketplace", Store],
          ["My orders", "orders", ShoppingBag],
          ["Wedding preparation", "planning", CalendarHeart],
          ["View budget", "budget", Wallet],
        ]
      : role === "vendor"
        ? [
            ["Manage products", "products", Package],
            ["Orders", "orders", ShoppingBag],
            ["Payment verification", "payments", Wallet],
            ["Reviews", "reviews", CheckCheck],
          ]
        : [
            ["Vendor verification", "vendor-verification", ShieldCheck],
            ["Users", "users", Users],
            ["Payment verification", "payments", Wallet],
            ["Reports", "reports", CheckCheck],
          ];
  const availableWidth = width >= 900 ? width - 260 : width;
  const columns =
    fontScale > 1.35 || availableWidth < 340 ? "100%" : availableWidth >= 700 ? "23%" : "46%";
  return (
    <Screen onRefresh={() => void resource.reload()} refreshing={resource.loading && Boolean(data)}>
      <View style={{ gap: 4 }}>
        <P muted>{t("Hello, {{name}}", { name: session!.user.name })}</P>
        <H1>
          {t(
            role === "customer"
              ? "Wedding dashboard"
              : role === "vendor"
                ? "Business dashboard"
                : "Marketplace overview",
          )}
        </H1>
      </View>
      {role === "customer" ? (
        <WeddingSummary />
      ) : (
        <P muted>
          {t(
            role === "vendor"
              ? "Manage bookings, packages, and payments in one place."
              : "Review the latest marketplace activity.",
          )}
        </P>
      )}
      <View style={{ gap: 12 }}>
        <H2>{t("Quick access")}</H2>
        <View style={styles.grid}>
          {shortcuts.map(([label, kind, Icon]) => (
            <Pressable
              key={kind}
              accessibilityRole="button"
              accessibilityLabel={t(label)}
              onPress={() => go(kind)}
              style={({ pressed }) => [
                dashboard.shortcut,
                { flexBasis: columns, opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <View style={dashboard.shortcutIcon}>
                <Icon size={19} color={colors.primary} />
              </View>
              <Text style={[styles.label, { flex: 1 }]}>{t(label)}</Text>
              <ChevronRight size={15} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      </View>
      {resource.loading && !data ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        data && (
          <>
            <View style={{ gap: 12 }}>
              <H2>{t("At a glance")}</H2>
              <View style={styles.grid}>
                {stats.map(([label, value, Icon]) => (
                  <Card
                    key={label}
                    style={{ flexGrow: 1, flexBasis: columns, minWidth: 0, gap: 8 }}
                  >
                    <Icon size={18} color={colors.primary} />
                    <Text style={styles.muted}>{t(label)}</Text>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      style={{
                        color: colors.ink,
                        fontSize: typeof value === "string" && value.length > 9 ? 18 : 23,
                        lineHeight: 31,
                        fontWeight: "700",
                        marginTop: "auto",
                      }}
                    >
                      {value}
                    </Text>
                  </Card>
                ))}
              </View>
            </View>
            <View style={{ gap: 12 }}>
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <H2>{t("Recent orders")}</H2>
                <Button title={t("View all orders")} variant="text" onPress={() => go("orders")} />
              </View>
              {data.recentOrders?.length ? (
                data.recentOrders.map((order) => (
                  <Pressable
                    key={order.id}
                    accessibilityRole="button"
                    accessibilityLabel={order.orderNumber}
                    onPress={() => go("order", order.id)}
                    style={({ pressed }) => [styles.card, { gap: 10, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View
                      style={[
                        styles.row,
                        { justifyContent: "space-between", alignItems: "flex-start" },
                      ]}
                    >
                      <Text style={[styles.label, { flexGrow: 1, flexShrink: 1, minWidth: 120 }]}>
                        {order.orderNumber}
                      </Text>
                      <Badge value={order.status} />
                    </View>
                    <View style={[styles.row, { justifyContent: "space-between" }]}>
                      <Text style={[styles.muted, { flexShrink: 1 }]}>
                        {order.vendor?.businessName ?? "—"}
                      </Text>
                      <Text style={styles.label}>{money(order.totalAmount, locale)}</Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Empty />
              )}
            </View>
          </>
        )
      )}
    </Screen>
  );
}

const dashboard = StyleSheet.create({
  wedding: { backgroundColor: "#F6EFE5", borderColor: "#E9DFD0", padding: 18, gap: 8 },
  metadata: { flexDirection: "row", alignItems: "center", gap: 7 },
  weddingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFFB3",
  },
  shortcut: {
    flexGrow: 1,
    minHeight: 76,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shortcutIcon: { width: 30, height: 36, alignItems: "center", justifyContent: "center" },
});
