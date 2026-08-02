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
  { label: "Home", href: ROUTES.home },
  { label: "Marketplace", href: ROUTES.customer.marketplace },
  { label: "Vendor", href: ROUTES.registerVendor },
  { label: "How It Works", href: ROUTES.howItWorks },
  { label: "About", href: ROUTES.about },
] as const;

export const CUSTOMER_NAVIGATION: NavigationItem[] = [
  { label: "Dashboard", href: ROUTES.customer.dashboard, icon: LayoutGrid },
  { label: "Marketplace", href: ROUTES.customer.marketplace, icon: ShoppingBag },
  { label: "Pesanan Saya", href: ROUTES.customer.orders, icon: ReceiptText },
  { label: "Progress Wedding", href: ROUTES.customer.progress, icon: ListChecks },
  { label: "Budget", href: ROUTES.customer.budget, icon: WalletCards },
  { label: "Profil", href: ROUTES.customer.profile, icon: UserRound },
  { label: "Notifikasi", href: ROUTES.customer.notifications, icon: Bell },
];

export const VENDOR_NAVIGATION: NavigationItem[] = [
  { label: "Dashboard", href: ROUTES.vendor.dashboard, icon: Gauge },
  { label: "Profil Bisnis", href: ROUTES.vendor.profile, icon: BriefcaseBusiness },
  { label: "Status Verifikasi", href: ROUTES.vendor.verificationStatus, icon: ShieldCheck },
  { label: "Kategori", href: ROUTES.vendor.category, icon: Tags },
  { label: "Produk", href: ROUTES.vendor.products, icon: Package },
  { label: "Pesanan", href: ROUTES.vendor.orders, icon: ClipboardCheck },
  { label: "Ulasan", href: ROUTES.vendor.reviews, icon: Star },
  { label: "Notifikasi", href: ROUTES.vendor.notifications, icon: Bell },
  { label: "Pengaturan", href: ROUTES.vendor.settings, icon: Settings },
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
  { label: "Dashboard", href: ROUTES.admin.dashboard, icon: Gauge },
  { label: "Verifikasi Vendor", href: ROUTES.admin.vendors, icon: ShieldCheck },
  { label: "Verifikasi Pembayaran", href: ROUTES.admin.payments, icon: CircleDollarSign },
  { label: "Pengguna", href: ROUTES.admin.users, icon: Users },
  { label: "Vendor", href: ROUTES.admin.vendorManagement, icon: Building2 },
  { label: "Kategori", href: ROUTES.admin.categories, icon: Tags },
  { label: "Produk", href: ROUTES.admin.products, icon: Boxes },
  { label: "Pesanan", href: ROUTES.admin.orders, icon: ReceiptText },
  { label: "Ulasan", href: ROUTES.admin.reviews, icon: MessageSquareText },
  { label: "Sengketa", href: ROUTES.admin.disputes, icon: Scale },
  { label: "Laporan", href: ROUTES.admin.reports, icon: FileClock },
  { label: "Audit Log", href: ROUTES.admin.auditLogs, icon: ClipboardCheck },
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
