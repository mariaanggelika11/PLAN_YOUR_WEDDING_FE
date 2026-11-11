import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Store, ShoppingBag, Package, LayoutGrid, ShieldCheck } from "lucide-react-native";
import { useAuth } from "../../auth/Provider";
import { useI18n } from "../../i18n";
import { colors } from "../../components/ui";
import { WorkspaceHeader } from "../../components/NavigationChrome";
import { ConsentGate } from "../../components/ConsentGate";
export const unstable_settings = { anchor: "dashboard" };
export default function TabLayout() {
  const { session } = useAuth();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const role = session?.user.role;
  return (
    <ConsentGate>
      <Tabs
        backBehavior="initialRoute"
        screenOptions={{
          header: () => <WorkspaceHeader />,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
          tabBarStyle: {
            backgroundColor: colors.paper,
            borderTopColor: colors.line,
            height: 62 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 6),
            display: width >= 900 ? "none" : "flex",
          },
          animation: "none",
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: t("Home"),
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Protected guard={role === "CUSTOMER"}>
          <Tabs.Screen
            name="marketplace"
            options={{
              title: t("Marketplace"),
              tabBarIcon: ({ color, size }) => <Store color={color} size={size} />,
            }}
          />
        </Tabs.Protected>
        <Tabs.Protected guard={role === "VENDOR"}>
          <Tabs.Screen
            name="products"
            options={{
              title: t("Products"),
              tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
            }}
          />
        </Tabs.Protected>
        <Tabs.Protected guard={role === "ADMIN"}>
          <Tabs.Screen
            name="verification"
            options={{
              title: t("Verification"),
              tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
            }}
          />
        </Tabs.Protected>
        <Tabs.Screen
          name="orders"
          options={{
            title: t("Orders"),
            tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: t("More"),
            tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
          }}
        />
      </Tabs>
    </ConsentGate>
  );
}
