import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useGlobalSearchParams, usePathname, useRouter, type Href } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  ChartNoAxesCombined,
  ClipboardList,
  FileCheck,
  FileText,
  Globe,
  Heart,
  House,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "../auth/Provider";
import { useI18n } from "../i18n";
import { menu, titles, type Kind } from "../navigation";
import { Brand, Button, IconButton, colors, styles, useConfirm } from "./ui";

const NavigationContext = createContext({ open: () => {}, wide: false });
const icons: Partial<Record<Kind, LucideIcon>> = {
  dashboard: House,
  marketplace: Store,
  orders: ShoppingBag,
  profile: UserRound,
  planning: CalendarCheck,
  budget: Wallet,
  notifications: Bell,
  products: Package,
  payments: Wallet,
  reviews: Heart,
  users: Users,
  vendors: Store,
  "vendor-verification": ShieldCheck,
  disputes: FileCheck,
  parameters: Settings,
  terms: FileText,
  reports: ChartNoAxesCombined,
  audit: ClipboardList,
};

function Drawer({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={chrome.overlay}>
        <Pressable accessible={false} onPress={onClose} style={StyleSheet.absoluteFill} />
        <SafeAreaView
          accessibilityViewIsModal
          style={[chrome.drawer, { width: Math.min(336, width - 32) }]}
        >
          <View style={chrome.drawerHeading}>
            <View style={{ flex: 1 }}>
              <Brand compact />
            </View>
            <IconButton label={t("Close menu")} onPress={onClose}>
              <X color={colors.ink} size={21} />
            </IconButton>
          </View>
          {children}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const { kind } = useGlobalSearchParams<{ kind?: string }>();
  const wide = Boolean(session) && width >= 900;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname, kind, session?.user.id, wide]);
  return (
    <NavigationContext.Provider value={{ open: () => setOpen(true), wide }}>
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.background }}>
        {wide && (
          <SafeAreaView style={chrome.sidebar}>
            <View style={chrome.drawerHeading}>
              <Brand compact />
            </View>
            <WorkspaceMenu onNavigate={() => setOpen(false)} />
          </SafeAreaView>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      </View>
      {session && !wide && (
        <Drawer visible={open} onClose={() => setOpen(false)}>
          <WorkspaceMenu onNavigate={() => setOpen(false)} />
        </Drawer>
      )}
    </NavigationContext.Provider>
  );
}

export function WorkspaceHeader({ back = false, title }: { back?: boolean; title?: string }) {
  const { open, wide } = useContext(NavigationContext);
  const { session } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigate = (kind: Kind) => router.push({ pathname: "/page", params: { kind } });
  return (
    <View style={[chrome.header, { paddingTop: insets.top }]}>
      <View style={chrome.headerRow}>
        {back ? (
          <IconButton
            label={t("Back")}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/dashboard"))}
          >
            <ArrowLeft size={21} color={colors.ink} />
          </IconButton>
        ) : (
          !wide && (
            <IconButton label={t("Navigation menu")} onPress={open}>
              <Menu size={22} color={colors.ink} />
            </IconButton>
          )
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          {back ? (
            <Text accessibilityRole="header" style={styles.h2}>
              {title}
            </Text>
          ) : (
            <Brand compact />
          )}
        </View>
        {session?.user.role !== "ADMIN" && (
          <IconButton label={t("Notifications")} onPress={() => navigate("notifications")}>
            <Bell color={colors.muted} size={21} />
          </IconButton>
        )}
        {back && !wide ? (
          <IconButton label={t("Navigation menu")} onPress={open}>
            <Menu color={colors.ink} size={22} />
          </IconButton>
        ) : (
          <IconButton label={t("Profile")} onPress={() => navigate("profile")}>
            <View style={chrome.avatar}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                {session?.user.name.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          </IconButton>
        )}
      </View>
    </View>
  );
}

function WorkspaceMenu({ onNavigate }: { onNavigate: () => void }) {
  const { session, logout } = useAuth();
  const { t, locale, toggleLanguage } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { kind: activeKind } = useGlobalSearchParams<{ kind?: string }>();
  const confirm = useConfirm();
  if (!session) return null;
  const role = session.user.role;
  const current =
    pathname === "/page"
      ? activeKind
      : pathname === "/verification"
        ? "vendor-verification"
        : pathname.slice(1);
  function navigate(kind: Kind) {
    onNavigate();
    const destination: Href =
      kind === "dashboard" || kind === "orders"
        ? `/${kind}`
        : kind === "marketplace" && role === "CUSTOMER"
          ? "/marketplace"
          : kind === "products" && role === "VENDOR"
            ? "/products"
            : kind === "vendor-verification" && role === "ADMIN"
              ? "/verification"
              : { pathname: "/page", params: { kind } };
    router.navigate(destination);
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 6 }}>
      <View style={{ paddingHorizontal: 10, paddingBottom: 18, gap: 3 }}>
        <Text style={[styles.label, { color: colors.primary }]}>
          {t(
            role === "CUSTOMER"
              ? "Customer area"
              : role === "VENDOR"
                ? "Seller center"
                : "Admin console",
          )}
        </Text>
        <Text style={styles.h2}>{session.user.name}</Text>
        <Text style={styles.muted}>{session.user.email}</Text>
      </View>
      {(["dashboard", ...menu[role]] as Kind[]).map((kind) => {
        const Icon = icons[kind] ?? FileText;
        const selected = current === kind;
        return (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t(titles[kind])}
            onPress={() => navigate(kind)}
            style={({ pressed }) => [
              chrome.menuItem,
              { backgroundColor: selected || pressed ? colors.soft : "transparent" },
            ]}
          >
            <Icon size={20} color={selected ? colors.primary : colors.muted} />
            <Text
              style={[
                styles.text,
                {
                  flex: 1,
                  color: selected ? colors.primary : colors.ink,
                  fontWeight: selected ? "600" : "400",
                },
              ]}
            >
              {t(titles[kind])}
            </Text>
          </Pressable>
        );
      })}
      <View style={[styles.separator, { marginVertical: 14 }]} />
      <View style={[styles.row, { justifyContent: "space-between", paddingHorizontal: 8 }]}>
        <Text style={styles.muted}>{t("Language")}</Text>
        <Button
          title={locale === "id" ? "ID · English" : "EN · Indonesia"}
          icon={<Globe size={17} color={colors.primary} />}
          variant="text"
          onPress={() => void toggleLanguage()}
        />
      </View>
      <Button
        title={t("Sign out")}
        variant="text"
        icon={<LogOut size={18} color={colors.primary} />}
        onPress={() =>
          confirm(t("Sign out"), () => {
            onNavigate();
            void logout();
          })
        }
      />
    </ScrollView>
  );
}

export type PublicSection = "how" | "about" | "start";
export function PublicHeader({
  back = false,
  onSection,
}: {
  back?: boolean;
  onSection?: (section: PublicSection) => void;
}) {
  const [open, setOpen] = useState(false);
  const { t, locale, toggleLanguage } = useI18n();
  const { width, fontScale } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const route = (href: Href) => {
    setOpen(false);
    router.push(href);
  };
  const section = (value: PublicSection) => {
    setOpen(false);
    if (onSection) onSection(value);
    else router.replace({ pathname: "/", params: { section: value } });
  };
  const wide = width / fontScale >= 1000;
  return (
    <>
      <View style={[chrome.header, { paddingTop: insets.top }]}>
        <View style={[chrome.headerRow, { maxWidth: 1160, alignSelf: "center", width: "100%" }]}>
          {back && (
            <IconButton label={t("Back to home")} onPress={() => router.replace("/")}>
              <ArrowLeft size={20} color={colors.ink} />
            </IconButton>
          )}
          <View style={{ flex: 1, minWidth: 0, paddingLeft: back ? 0 : 8 }}>
            <Brand compact />
          </View>
          {wide && (
            <>
              {!back && (
                <>
                  <Button title={t("Marketplace")} variant="text" onPress={() => route("/auth")} />
                  <Button
                    title={t("Vendor")}
                    variant="text"
                    onPress={() => route({ pathname: "/auth", params: { mode: "vendor" } })}
                  />
                </>
              )}
              <Button title={t("How it works")} variant="text" onPress={() => section("how")} />
              {!back && (
                <>
                  <Button title={t("About")} variant="text" onPress={() => section("about")} />
                  <Button title={t("Sign in")} variant="text" onPress={() => route("/auth")} />
                </>
              )}
            </>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={locale.toUpperCase()}
            accessibilityHint={t("Choose a language")}
            onPress={() => void toggleLanguage()}
            style={chrome.language}
          >
            <Globe size={16} color={colors.muted} />
            <Text style={styles.label}>{locale.toUpperCase()}</Text>
          </Pressable>
          {wide ? (
            <Button title={t("Get started")} onPress={() => section("start")} />
          ) : (
            <IconButton label={t("Navigation menu")} onPress={() => setOpen(true)}>
              <Menu color={colors.ink} size={22} />
            </IconButton>
          )}
        </View>
      </View>
      <Drawer visible={open} onClose={() => setOpen(false)}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
          <Text style={[styles.muted, { marginBottom: 12 }]}>{t("Celebrate with confidence")}</Text>
          {(
            [
              [
                "Home",
                () => {
                  setOpen(false);
                  router.replace("/");
                },
              ],
              ["Marketplace", () => route("/auth")],
              ["Vendor", () => route({ pathname: "/auth", params: { mode: "vendor" } })],
              ["How it works", () => section("how")],
              ["About", () => section("about")],
              ["Get started", () => section("start")],
            ] as const
          ).map(([label, action]) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={t(label)}
              onPress={action}
              style={chrome.menuItem}
            >
              <Text style={styles.text}>{t(label)}</Text>
            </Pressable>
          ))}
          <View style={[styles.separator, { marginVertical: 12 }]} />
          <Button title={t("Sign in")} onPress={() => route("/auth")} />
          <Button
            title={t("Register as a customer")}
            variant="secondary"
            onPress={() => route({ pathname: "/auth", params: { mode: "customer" } })}
          />
          <Button
            title={t("Register as a vendor")}
            variant="secondary"
            onPress={() => route({ pathname: "/auth", params: { mode: "vendor" } })}
          />
        </ScrollView>
      </Drawer>
    </>
  );
}

const chrome = StyleSheet.create({
  header: {
    backgroundColor: colors.paper,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  headerRow: {
    minHeight: 64,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { flex: 1, backgroundColor: "#29252480" },
  drawer: {
    height: "100%",
    backgroundColor: colors.paper,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  sidebar: {
    width: 260,
    backgroundColor: colors.paper,
    borderRightWidth: 1,
    borderColor: colors.line,
  },
  drawerHeading: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  menuItem: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  language: {
    minHeight: 48,
    paddingHorizontal: 9,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});
