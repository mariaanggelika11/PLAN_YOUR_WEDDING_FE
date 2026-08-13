"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { BrandMark } from "@/components/common/BrandMark";
import { mockNotifications, mockUsers } from "@/constants/mockData";
import { USER_MENU_ITEMS, type NavigationItem } from "@/constants/menu";
import { roleRoute, ROUTES, type AppRole } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

interface AppShellProps {
  role: AppRole;
  label: string;
  nav: NavigationItem[];
  children: ReactNode;
}

export function AppShell({ role, label, nav, children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dark = false;

  // TODO API: Ambil data user login dari backend
  // TODO API: Ambil jumlah notifikasi belum dibaca dari backend
  // TODO API: Tampilkan menu mobile berdasarkan role user login
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        dark={dark}
        label={label}
        nav={nav}
        pathname={pathname}
      />
      <div
        className={cn(
          "transition-[padding] duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-72",
        )}
      >
        <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b bg-white/85 px-4 backdrop-blur-xl lg:px-8">
          <MobileSidebar dark={dark} label={label} nav={nav} pathname={pathname} />
          <button
            aria-label={sidebarCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="hidden size-10 place-items-center rounded-xl border bg-white text-stone-500 hover:border-blush hover:text-blush lg:grid"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <NotificationMenu />
            <UserMenu role={role} />
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-6 lg:p-8">{children}</main>
        {role === "customer" && <BottomNav nav={nav.slice(0, 4)} pathname={pathname} />}
      </div>
    </div>
  );
}

function DesktopSidebar({
  collapsed,
  dark,
  label,
  nav,
  pathname,
}: {
  collapsed: boolean;
  dark: boolean;
  label: string;
  nav: NavigationItem[];
  pathname: string;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-40 hidden border-r transition-[width,padding] duration-300 lg:block",
        collapsed ? "w-20 p-3" : "w-72 p-5",
        dark ? "border-slate-800 bg-[#101828] text-white" : "bg-white",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-start")}>
        <BrandMark compact={collapsed} dark={dark} />
      </div>
      {!collapsed && (
        <p
          className={cn(
            "mt-8 px-3 text-[11px] font-bold uppercase tracking-[.2em]",
            dark ? "text-slate-500" : "text-stone-400",
          )}
        >
          {label}
        </p>
      )}
      <NavList collapsed={collapsed} dark={dark} nav={nav} pathname={pathname} />
      {!collapsed && (
        <div
          className={cn(
            "absolute bottom-5 left-5 right-5 rounded-2xl p-4 text-xs",
            dark ? "bg-slate-800 text-slate-300" : "bg-rose-50 text-stone-600",
          )}
        >
          <p className="font-semibold">Butuh bantuan?</p>
          <p className="mt-1 opacity-70">Tim support siap membantu Anda.</p>
        </div>
      )}
    </aside>
  );
}

function NavList({
  collapsed = false,
  dark,
  nav,
  pathname,
}: {
  collapsed?: boolean;
  dark: boolean;
  nav: NavigationItem[];
  pathname: string;
}) {
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    nav
      .filter((item) => item.children?.some((child) => pathname.startsWith(child.href)))
      .map((item) => item.label),
  );
  return (
    <nav className={cn("grid gap-1", collapsed ? "mt-8" : "mt-3")}>
      {nav.map((item) => {
        const childActive = item.children?.some(
          (child) => pathname === child.href || pathname.startsWith(`${child.href}/`),
        );
        const active =
          childActive || pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        if (item.children && !collapsed) {
          const open = openGroups.includes(item.label);
          return (
            <div className="grid gap-1" key={item.label}>
              <button
                aria-expanded={open}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  active
                    ? "bg-rose-50 font-semibold text-blush"
                    : "text-stone-600 hover:bg-stone-50 hover:text-ink",
                )}
                onClick={() =>
                  setOpenGroups((current) =>
                    current.includes(item.label)
                      ? current.filter((label) => label !== item.label)
                      : [...current, item.label],
                  )
                }
                type="button"
              >
                <Icon className="shrink-0" size={17} />
                <span>{item.label}</span>
                <ChevronDown className={cn("ml-auto transition", open && "rotate-180")} size={15} />
              </button>
              {open && (
                <div className="ml-5 grid gap-1 border-l border-rose-100 pl-3">
                  {item.children.map((child) => {
                    const selected =
                      pathname === child.href || pathname.startsWith(`${child.href}/`);
                    return (
                      <Link
                        className={cn(
                          "rounded-lg px-3 py-2 text-xs transition",
                          selected
                            ? "bg-rose-50 font-semibold text-blush"
                            : "text-stone-500 hover:bg-stone-50 hover:text-ink",
                        )}
                        href={child.href}
                        key={child.href}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        return (
          <Link
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm transition",
              collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
              active
                ? dark
                  ? "bg-blush text-white shadow-lg shadow-black/20"
                  : "bg-rose-50 font-semibold text-blush"
                : dark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-stone-600 hover:bg-stone-50 hover:text-ink",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="shrink-0" size={17} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileSidebar(props: {
  dark: boolean;
  label: string;
  nav: NavigationItem[];
  pathname: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          aria-label="Buka menu"
          className="grid size-10 place-items-center rounded-xl border bg-white lg:hidden"
        >
          <Menu size={18} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[min(88vw,330px)] p-5 shadow-2xl",
            props.dark ? "bg-[#101828] text-white" : "bg-white",
          )}
        >
          <div className="flex items-center justify-between">
            <BrandMark dark={props.dark} />
            <Dialog.Close
              aria-label="Tutup menu"
              className="grid size-9 place-items-center rounded-xl border"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <p className="mt-8 text-xs uppercase tracking-widest opacity-50">{props.label}</p>
          <NavList {...props} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GlobalSearch() {
  return (
    <div className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border bg-stone-50 px-3 py-2.5 text-stone-400 md:flex">
      <Search size={17} />
      <input
        aria-label="Pencarian global"
        className="w-full bg-transparent text-sm outline-none"
        placeholder="Cari halaman, order, atau vendor..."
      />
    </div>
  );
}

function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const unreadCount = mockNotifications.filter((notification) => !notification.read).length;
  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-label="Buka notifikasi"
        onClick={() => setOpen((current) => !current)}
        className="relative grid size-10 place-items-center rounded-xl border bg-white text-stone-500 hover:text-blush"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(88vw,390px)] rounded-3xl border bg-white p-5 shadow-2xl">
          <h3 className="font-semibold">Notifikasi terbaru</h3>
          <div className="mt-4 grid gap-2">
            {mockNotifications.map((notification) => (
              <article className="rounded-2xl bg-rose-50 p-4" key={notification.id}>
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="mt-1 text-xs text-stone-500">{notification.message}</p>
              </article>
            ))}
          </div>
          <button className="mt-4 text-sm font-semibold text-blush">
            Tandai semua sudah dibaca
          </button>
        </div>
      )}
    </div>
  );
}

function UserMenu({ role }: { role: AppShellProps["role"] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const fallbackUser = mockUsers.find((item) => item.role.toLowerCase() === role);
  const currentUser = user ?? fallbackUser;
  const name = currentUser?.name ?? "Pengguna";
  const initials = name
    .split(" ")
    .map((item) => item[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace(ROUTES.login);
      router.refresh();
    }
  }

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        type="button"
        className="flex items-center gap-2 rounded-xl border bg-white p-1.5 pr-2 shadow-sm hover:border-rose-200"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-rose-200 to-amber-100 text-xs font-bold text-ink">
          {initials}
        </span>
        <span className="hidden max-w-28 text-left sm:block">
          <span className="block truncate text-xs font-semibold">{name}</span>
          <span className="block text-[10px] uppercase text-stone-400">{role}</span>
        </span>
        <ChevronDown className={cn("transition", open && "rotate-180")} size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border bg-white p-2 shadow-2xl">
          <div className="mb-1 border-b px-3 py-2">
            <p className="truncate text-xs font-semibold">{name}</p>
            <p className="truncate text-[11px] text-stone-400">{currentUser?.email}</p>
          </div>
          {USER_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-stone-50"
                href={roleRoute(role, item.path)}
                key={item.path}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
          <button
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} />
            {isLoggingOut ? "Sedang keluar..." : "Keluar"}
          </button>
        </div>
      )}
    </div>
  );
}

function BottomNav({ nav, pathname }: { nav: NavigationItem[]; pathname: string }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border bg-white/95 p-1.5 shadow-2xl backdrop-blur lg:hidden">
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            className={cn(
              "grid place-items-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-semibold",
              pathname.startsWith(item.href) ? "bg-rose-50 text-blush" : "text-stone-500",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon size={15} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
