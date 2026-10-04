"use client";

import { useAuth } from "@/features/auth/useAuth";
import { NotificationProvider } from "@/features/notifications/NotificationProvider";
import { NotificationMenu } from "@/features/notifications/NotificationMenu";
import { getAttachmentBlob, getVendorLogo } from "@/features/profile/api/attachmentApi";
import { useProfileData } from "@/features/profile/context/ProfileProvider";
import type { CustomerApiProfile, VendorApiProfile } from "@/features/profile/types";
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
import { ChevronDown, ChevronRight, LogOut, Menu, PanelLeftClose, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

interface AppShellProps {
  role: AppRole;
  label: string;
  nav: NavigationItem[];
  children: ReactNode;
}

export function AppShell(props: AppShellProps) {
  return (
    <NotificationProvider>
      <AppShellContent {...props} />
    </NotificationProvider>
  );
}
function AppShellContent({ role, label, nav, children }: AppShellProps) {
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

  const activeNavigation = nav
    .flatMap((item) => item.children ?? [item])
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  // TODO API: Ambil data user login dari backend
  // TODO API: Tampilkan menu mobile berdasarkan role user login
  return (
    <PageHeaderContext.Provider value={setPageHeader}>
      <div className="min-h-screen bg-canvas">
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          dark={dark}
          label={translatedLabel || label}
          nav={nav}
          pathname={pathname}
        />
        <div
          className={cn(
            "transition-[padding] duration-300",
            sidebarCollapsed ? "lg:pl-20" : "lg:pl-64",
          )}
        >
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-stone-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <button
              aria-controls="desktop-sidebar"
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? t("shell.showSidebar") : t("shell.collapseSidebar")}
              title={sidebarCollapsed ? t("shell.showSidebar") : t("shell.collapseSidebar")}
              className="hidden size-10 shrink-0 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-ink lg:grid"
              onClick={() => setSidebarCollapsed((current) => !current)}
              type="button"
            >
              {sidebarCollapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <MobileSidebar
              dark={dark}
              label={translatedLabel || label}
              nav={nav}
              pathname={pathname}
            />
            <div className="hidden min-w-0 items-center gap-3 border-l pl-4 text-sm sm:flex">
              <span className="hidden shrink-0 text-stone-500 md:inline">
                {translatedLabel || label}
              </span>
              <ChevronRight
                aria-hidden="true"
                size={14}
                className="hidden shrink-0 text-stone-300 md:block"
              />
              <span className="truncate font-medium text-ink">
                {activeNavigation ? t(activeNavigation.translationKey) : translatedLabel || label}
              </span>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <LanguageSwitcher className="min-h-10 border-transparent bg-transparent px-2.5 py-2 text-stone-600 hover:border-transparent hover:bg-stone-100" />
              <NotificationMenu role={role} />
              <UserMenu role={role} />
            </div>
          </header>
          <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
            {pageHeader && (
              <div className="mb-6 min-w-0 lg:mb-8">
                <h1 className="page-heading break-words">{pageHeader.title}</h1>
                <p className="page-description">{pageHeader.description}</p>
              </div>
            )}
            {children}
          </main>
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
  pathname,
}: {
  collapsed: boolean;
  dark: boolean;
  label: string;
  nav: NavigationItem[];
  pathname: string;
}) {
  const { t } = useTranslation();
  return (
    <aside
      id="desktop-sidebar"
      className={cn(
        "fixed inset-y-0 z-40 hidden overflow-y-auto border-r transition-[width,padding] duration-300 lg:flex lg:flex-col",
        collapsed ? "w-20 p-3" : "w-64 p-3",
        dark ? "border-slate-800 bg-[#101828] text-white" : "bg-white",
      )}
    >
      <div className={cn("flex h-10 items-center", collapsed ? "justify-center" : "px-1")}>
        <BrandMark compact={collapsed} dark={dark} />
      </div>
      {!collapsed && (
        <p
          className={cn(
            "mt-8 px-3 text-[11px] font-semibold uppercase tracking-[.2em]",
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
            "mt-auto rounded-xl p-4 pt-5 text-xs",
            dark ? "bg-slate-800 text-slate-300" : "bg-stone-50 text-stone-600",
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
  onNavigate,
}: {
  onNavigate?: () => void;
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
    <nav className={cn("grid gap-1 pb-8", collapsed ? "mt-8" : "mt-3")}>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
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
                        onClick={onNavigate}
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
              "flex items-center rounded-lg text-sm transition",
              collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
              active
                ? dark
                  ? "bg-blush text-white shadow-soft shadow-black/20"
                  : "bg-rose-50 font-semibold text-blush"
                : dark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-stone-600 hover:bg-stone-50 hover:text-ink",
            )}
            href={item.href}
            onClick={onNavigate}
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
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [props.pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label={t("shell.openMenu")}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "mobile-sidebar fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] overflow-y-auto p-4 shadow-overlay",
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
              className="grid size-10 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <p className="mt-8 text-xs uppercase tracking-widest opacity-50">{props.label}</p>
          <NavList {...props} onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function UserMenu({ role }: { role: AppShellProps["role"] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const containerRef = useDismissibleLayer<HTMLDivElement>(open, () => setOpen(false));
  const { user, logout } = useAuth();
  const profileResource = useProfileData(
    role === "vendor" ? "vendor" : "customer",
    role !== "admin",
  );
  const currentUser = user;
  useEffect(() => setOpen(false), [pathname]);
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
        aria-label={`${t("account.user")}: ${name}`}
        onClick={() => setOpen((current) => !current)}
        type="button"
        className="flex h-10 items-center gap-2 rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 sm:ml-1 sm:gap-2.5"
      >
        <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-cream text-xs font-semibold text-ink">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`Foto ${name}`} className="size-full object-cover" src={avatarUrl} />
          ) : (
            initials
          )}
        </span>
        <span className="hidden max-w-36 text-left md:block">
          <span className="block truncate text-sm font-medium">{name}</span>
        </span>
        <ChevronDown className={cn("transition", open && "rotate-180")} size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-white p-2 shadow-overlay">
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
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-white px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] lg:hidden">
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
