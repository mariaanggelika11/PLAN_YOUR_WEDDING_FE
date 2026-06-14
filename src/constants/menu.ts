import {
  Bell,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  Gauge,
  HeartHandshake,
  LayoutGrid,
  ListChecks,
  MessageSquareText,
  Package,
  ReceiptText,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tags,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const APP_BRAND = {
  name: "Plan Your Wedding",
  shortName: "PYW",
  tagline: "Celebrate with confidence",
} as const;

export const PUBLIC_NAVIGATION = [
  { label: "Home", href: "/" },
  { label: "Marketplace", href: ROUTES.customer.marketplace },
  { label: "Vendor", href: "/register/vendor" },
  { label: "How It Works", href: "/#cara-kerja" },
  { label: "About", href: "/#tentang" },
] as const;

export const CUSTOMER_NAVIGATION: NavigationItem[] = [
  { label: "Dashboard", href: ROUTES.customer.dashboard, icon: LayoutGrid },
  { label: "Marketplace", href: ROUTES.customer.marketplace, icon: ShoppingBag },
  { label: "Pesanan Saya", href: ROUTES.customer.orders, icon: ReceiptText },
  { label: "Progress Wedding", href: "/customer/progress", icon: ListChecks },
  { label: "Budget", href: "/customer/budget", icon: WalletCards },
  { label: "Profil", href: ROUTES.customer.profile, icon: UserRound },
  { label: "Notifikasi", href: "/customer/notifications", icon: Bell },
];

export const VENDOR_NAVIGATION: NavigationItem[] = [
  { label: "Dashboard", href: ROUTES.vendor.dashboard, icon: Gauge },
  { label: "Profil Bisnis", href: ROUTES.vendor.profile, icon: BriefcaseBusiness },
  { label: "Status Verifikasi", href: "/vendor/verification-status", icon: ShieldCheck },
  { label: "Kategori", href: "/vendor/category", icon: Tags },
  { label: "Produk", href: ROUTES.vendor.products, icon: Package },
  { label: "Pesanan", href: ROUTES.vendor.orders, icon: ClipboardCheck },
  { label: "Ulasan", href: "/vendor/reviews", icon: Star },
  { label: "Notifikasi", href: "/vendor/notifications", icon: Bell },
  { label: "Pengaturan", href: "/vendor/settings", icon: Settings },
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
  { label: "Dashboard", href: ROUTES.admin.dashboard, icon: Gauge },
  { label: "Verifikasi Vendor", href: ROUTES.admin.vendors, icon: ShieldCheck },
  { label: "Verifikasi Pembayaran", href: ROUTES.admin.payments, icon: CircleDollarSign },
  { label: "Pengguna", href: "/admin/users", icon: Users },
  { label: "Vendor", href: "/admin/vendors", icon: Building2 },
  { label: "Kategori", href: "/admin/categories", icon: Tags },
  { label: "Produk", href: "/admin/products", icon: Boxes },
  { label: "Pesanan", href: "/admin/orders", icon: ReceiptText },
  { label: "Ulasan", href: "/admin/reviews", icon: MessageSquareText },
  { label: "Sengketa", href: "/admin/disputes", icon: Scale },
  { label: "Laporan", href: "/admin/reports", icon: FileClock },
  { label: "Audit Log", href: "/admin/audit-logs", icon: ClipboardCheck },
];

export const USER_MENU_ITEMS = [
  { label: "Dashboard", path: "dashboard", icon: LayoutGrid },
  { label: "Profil", path: "profile", icon: UserRound },
  { label: "Pengaturan", path: "settings", icon: Settings },
] as const;

export const ROLE_LABELS = {
  customer: "Customer Area",
  vendor: "Seller Center",
  admin: "Admin Console",
} as const;

export const categoryLabels = [
  "Catering",
  "Wedding Organizer",
  "Decoration",
  "Makeup Artist",
  "Photography",
  "Videography",
  "Venue",
  "Entertainment",
  "Invitation",
  "Souvenir",
  "Sound System & Lighting",
  "MC",
  "Wedding Cake",
  "Henna",
  "Transportation",
  "Jewelry",
  "Live Streaming",
] as const;
