"use client";

import { useAuth } from "@/features/auth/useAuth";
import { OrderAssistant } from "@/features/assistant/OrderAssistant";
import { notificationRepository } from "@/features/notifications/repository";
import { getAttachmentBlob, getVendorLogo } from "@/features/profile/api/attachmentApi";
import { useProfileData } from "@/features/profile/context/ProfileProvider";
import type { CustomerApiProfile, VendorApiProfile } from "@/features/profile/types";
import { mockUsers } from "@/mocks/mockData";
import { BrandMark } from "@/shared/components/BrandMark";
import {
  PageHeaderContext,
  type ShellPageHeader,
} from "@/shared/components/layout/PageHeaderContext";
import { USER_MENU_ITEMS, type NavigationItem } from "@/shared/config/navigation";
import { roleRoute, ROUTES, type AppRole } from "@/shared/config/routes";
import { useDismissibleLayer } from "@/shared/hooks/useDismissibleLayer";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

interface AppShellProps {
  role: AppRole;
  label: string;
  nav: NavigationItem[];
  children: ReactNode;
}

export function AppShell({ role, label, nav, children }: AppShellProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pageHeader, setPageHeader] = useState<ShellPageHeader | null>(null);
  const dark = false;
  const translatedLabel = t(
    role === "customer"
      ? "shell.customerArea"
      : role === "vendor"
        ? "shell.vendorArea"
        : "shell.adminArea",
  );

  // TODO API: Ambil data user login dari backend
  // TODO API: Ambil jumlah notifikasi belum dibaca dari backend
  // TODO API: Tampilkan menu mobile berdasarkan role user login
  return (
    <PageHeaderContext.Provider value={setPageHeader}>
      <div className="min-h-screen bg-[#faf8f5]">
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          dark={dark}
          label={translatedLabel || label}
          nav={nav}
          onToggle={() => setSidebarCollapsed((current) => !current)}
          pathname={pathname}
        />
        <div
          className={cn(
            "transition-[padding] duration-300",
            sidebarCollapsed ? "lg:pl-20" : "lg:pl-72",
          )}
        >
          <header className="sticky top-0 z-30 flex min-h-16 items-center gap-4 border-b bg-white/90 px-4 py-3 backdrop-blur-xl lg:px-6">
            <MobileSidebar
              dark={dark}
              label={translatedLabel || label}
              nav={nav}
              pathname={pathname}
            />
            {pageHeader && (
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
                  {pageHeader.title}
                </h1>
                <p className="mt-0.5 hidden truncate text-xs text-stone-500 sm:block">
                  {pageHeader.description}
                </p>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher className="min-h-10 px-3 py-2" />
              <NotificationMenu />
              <UserMenu role={role} />
            </div>
          </header>
          <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-6">{children}</main>
          {role !== "admin" && <OrderAssistant role={role} />}
          {role === "customer" && <BottomNav nav={nav.slice(0, 4)} pathname={pathname} />}
        </div>
      </div>
    </PageHeaderContext.Provider>
  );
}

function DesktopSidebar({
  collapsed,
  dark,
  label,
  nav,
  onToggle,
  pathname,
}: {
  collapsed: boolean;
  dark: boolean;
  label: string;
  nav: NavigationItem[];
  onToggle: () => void;
  pathname: string;
}) {
  const { t } = useTranslation();
  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-40 hidden border-r transition-[width,padding] duration-300 lg:block",
        collapsed ? "w-20 p-3" : "w-72 p-5",
        dark ? "border-slate-800 bg-[#101828] text-white" : "bg-white",
      )}
    >
      <div
        className={cn("flex items-center", collapsed ? "flex-col justify-center" : "justify-start")}
      >
        <BrandMark compact={collapsed} dark={dark} />
        <button
          aria-label={collapsed ? t("shell.showSidebar") : t("shell.collapseSidebar")}
          className={cn(
            "ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-ink",
            collapsed && "ml-0 mt-2",
            dark && "hover:bg-slate-800 hover:text-white",
          )}
          onClick={onToggle}
          title={collapsed ? t("shell.showSidebar") : t("shell.collapseSidebar")}
          type="button"
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
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
          <p className="font-semibold">{t("shell.helpTitle")}</p>
          <p className="mt-1 opacity-70">{t("shell.helpDescription")}</p>
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
  const { t } = useTranslation();
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    nav
      .filter((item) => item.children?.some((child) => pathname.startsWith(child.href)))
      .map((item) => item.href),
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
          const open = openGroups.includes(item.href);
          return (
            <div className="grid gap-1" key={item.href}>
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
                    current.includes(item.href)
                      ? current.filter((href) => href !== item.href)
                      : [...current, item.href],
                  )
                }
                type="button"
              >
                <Icon className="shrink-0" size={17} />
                <span>{t(item.translationKey)}</span>
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
                        {t(child.translationKey)}
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
            aria-label={t(item.translationKey)}
            title={collapsed ? t(item.translationKey) : undefined}
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
            {!collapsed && <span>{t(item.translationKey)}</span>}
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
  const { t } = useTranslation();
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          aria-label={t("shell.openMenu")}
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
          <Dialog.Title className="sr-only">Menu {props.label}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {t("shell.mainNavigation", { area: props.label })}
          </Dialog.Description>
          <div className="flex items-center justify-between">
            <BrandMark dark={props.dark} />
            <Dialog.Close
              aria-label={t("shell.closeMenu")}
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

function NotificationMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useDismissibleLayer<HTMLDivElement>(open, () => setOpen(false));
  const unreadCount = notificationRepository
    .list()
    .filter((notification) => !notification.read).length;
  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-label={t("notification.open")}
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
          <h3 className="font-semibold">{t("notification.latest")}</h3>
          <div className="mt-4 grid gap-2">
            {notificationRepository.list().map((notification) => (
              <article className="rounded-2xl bg-rose-50 p-4" key={notification.id}>
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="mt-1 text-xs text-stone-500">{notification.message}</p>
              </article>
            ))}
          </div>
          <button className="mt-4 text-sm font-semibold text-blush">
            {t("notification.markAllRead")}
          </button>
        </div>
      )}
    </div>
  );
}

function UserMenu({ role }: { role: AppShellProps["role"] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const containerRef = useDismissibleLayer<HTMLDivElement>(open, () => setOpen(false));
  const { user, logout } = useAuth();
  const profileResource = useProfileData(
    role === "vendor" ? "vendor" : "customer",
    role !== "admin",
  );
  const fallbackUser = mockUsers.find((item) => item.role.toLowerCase() === role);
  const currentUser = user ?? fallbackUser;
  const name = currentUser?.name ?? t("account.user");
  const initials = name
    .split(" ")
    .map((item) => item[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    let disposed = false;
    let objectUrl = "";

    async function loadAvatar() {
      if (role === "admin") return;
      try {
        let attachmentId: string | null | undefined;
        if (role === "vendor") {
          const profile = profileResource.data as VendorApiProfile | null;
          attachmentId = profile?.logoAttachmentId;
          if (!attachmentId && profile?.id) {
            attachmentId = (await getVendorLogo(profile.id))?.id;
          }
        } else {
          attachmentId = (profileResource.data as CustomerApiProfile | null)?.avatarAttachmentId;
        }
        if (!attachmentId || disposed) return setAvatarUrl("");
        const blob = await getAttachmentBlob(attachmentId);
        if (disposed) return;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(blob);
        setAvatarUrl(objectUrl);
      } catch {
        if (!disposed) setAvatarUrl("");
      }
    }

    void loadAvatar();
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profileResource.data, role]);

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
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        type="button"
        className="flex items-center gap-2 rounded-xl border bg-white p-1.5 pr-2 shadow-sm hover:border-rose-200"
      >
        <span className="grid size-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-rose-200 to-amber-100 text-xs font-bold text-ink">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`Foto ${name}`} className="size-full object-cover" src={avatarUrl} />
          ) : (
            initials
          )}
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
                onClick={() => setOpen(false)}
              >
                <Icon size={15} />
                {t(item.translationKey)}
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
            {isLoggingOut ? t("account.loggingOut") : t("account.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

function BottomNav({ nav, pathname }: { nav: NavigationItem[]; pathname: string }) {
  const { t } = useTranslation();
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
            {t(item.translationKey)}
          </Link>
        );
      })}
    </nav>
  );
}
