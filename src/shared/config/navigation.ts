import { ROUTES } from "@/shared/config/routes";
import type { TranslationKey } from "@/shared/i18n/dictionaries/id";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  Gauge,
  LayoutGrid,
  ListChecks,
  Package,
  ReceiptText,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  translationKey: TranslationKey;
  children?: Array<{ label: string; href: string; translationKey: TranslationKey }>;
}

export const APP_BRAND = {
  name: "Plan Your Wedding",
  shortName: "PYW",
  tagline: "Celebrate with confidence",
} as const;

export const PUBLIC_NAVIGATION = [
  { label: "Home", href: ROUTES.home },
  { label: "Marketplace", href: ROUTES.customer.marketplace },
  { label: "Vendor", href: ROUTES.registerVendor },
  { label: "How It Works", href: ROUTES.howItWorks },
  { label: "About", href: ROUTES.about },
] as const;

export const CUSTOMER_NAVIGATION: NavigationItem[] = [
  {
    label: "Dashboard",
    translationKey: "navigation.dashboard",
    href: ROUTES.customer.dashboard,
    icon: LayoutGrid,
  },
  {
    label: "Marketplace",
    translationKey: "navigation.marketplace",
    href: ROUTES.customer.marketplace,
    icon: ShoppingBag,
  },
  {
    label: "Pesanan Saya",
    translationKey: "navigation.myOrders",
    href: ROUTES.customer.orders,
    icon: ReceiptText,
  },
  {
    label: "Progress Wedding",
    translationKey: "navigation.weddingProgress",
    href: ROUTES.customer.progress,
    icon: ListChecks,
  },
  {
    label: "Budget",
    translationKey: "navigation.budget",
    href: ROUTES.customer.budget,
    icon: WalletCards,
  },
  {
    label: "Profil",
    translationKey: "navigation.profile",
    href: ROUTES.customer.profile,
    icon: UserRound,
  },
  {
    label: "Notifikasi",
    translationKey: "navigation.notifications",
    href: ROUTES.customer.notifications,
    icon: Bell,
  },
];

export const VENDOR_NAVIGATION: NavigationItem[] = [
  {
    label: "Dashboard",
    translationKey: "navigation.dashboard",
    href: ROUTES.vendor.dashboard,
    icon: Gauge,
  },
  {
    label: "Profil Bisnis",
    translationKey: "navigation.businessProfile",
    href: ROUTES.vendor.profile,
    icon: BriefcaseBusiness,
  },
  {
    label: "Produk",
    translationKey: "navigation.products",
    href: ROUTES.vendor.products,
    icon: Package,
  },
  {
    label: "Pesanan",
    translationKey: "navigation.orders",
    href: ROUTES.vendor.orders,
    icon: ClipboardCheck,
  },
  {
    label: "Ulasan",
    translationKey: "navigation.reviews",
    href: ROUTES.vendor.reviews,
    icon: Star,
  },
  {
    label: "Notifikasi",
    translationKey: "navigation.notifications",
    href: ROUTES.vendor.notifications,
    icon: Bell,
  },
  {
    label: "Pengaturan",
    translationKey: "navigation.settings",
    href: ROUTES.vendor.settings,
    icon: Settings,
  },
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    label: "Dashboard",
    translationKey: "navigation.dashboard",
    href: ROUTES.admin.dashboard,
    icon: Gauge,
  },
  {
    label: "Verifikasi Vendor",
    translationKey: "navigation.vendorVerification",
    href: ROUTES.admin.vendors,
    icon: ShieldCheck,
  },
  {
    label: "Verifikasi Pembayaran",
    translationKey: "navigation.paymentVerification",
    href: ROUTES.admin.payments,
    icon: CircleDollarSign,
  },
  { label: "Pengguna", translationKey: "navigation.users", href: ROUTES.admin.users, icon: Users },
  {
    label: "Vendor",
    translationKey: "navigation.vendors",
    href: ROUTES.admin.vendorManagement,
    icon: Building2,
  },
  {
    label: "Sengketa",
    translationKey: "navigation.disputes",
    href: ROUTES.admin.disputes,
    icon: Scale,
  },
  {
    label: "Laporan",
    translationKey: "navigation.reports",
    href: ROUTES.admin.reports,
    icon: FileClock,
  },
  {
    label: "Audit Log",
    translationKey: "navigation.auditLog",
    href: ROUTES.admin.auditLogs,
    icon: ClipboardCheck,
  },
  {
    label: "Master Data",
    translationKey: "navigation.masterData",
    href: ROUTES.admin.parameters,
    icon: Settings,
    children: [
      {
        label: "Master Parameter",
        translationKey: "navigation.masterParameter",
        href: ROUTES.admin.parameters,
      },
    ],
  },
];

export const USER_MENU_ITEMS = [
  {
    label: "Dashboard",
    translationKey: "navigation.dashboard",
    path: "dashboard",
    icon: LayoutGrid,
  },
  { label: "Profil", translationKey: "navigation.profile", path: "profile", icon: UserRound },
  { label: "Pengaturan", translationKey: "navigation.settings", path: "settings", icon: Settings },
] as const;

export const ROLE_LABELS = {
  customer: "Customer Area",
  vendor: "Seller Center",
  admin: "Admin Console",
} as const;
