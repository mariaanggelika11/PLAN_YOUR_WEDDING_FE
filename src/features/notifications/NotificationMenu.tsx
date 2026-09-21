"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useDismissibleLayer } from "@/shared/hooks/useDismissibleLayer";
import { useTranslation } from "@/shared/i18n/useTranslation";
import type { AppRole } from "@/shared/config/routes";
import { useNotifications } from "./NotificationProvider";
import { NotificationItem } from "./NotificationItem";

export function NotificationMenu({ role }: { role: AppRole }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useDismissibleLayer<HTMLDivElement>(open, () => setOpen(false));
  const state = useNotifications();
  const count = state.latest?.unreadCount ?? 0;
  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-label={t("notification.open")}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void state.refresh();
        }}
        className="relative grid size-10 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-ink"
      >
        <Bell size={20} />
        {!state.error && count > 0 && (
          <span className="absolute right-1 top-1 rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <section
          aria-label={t("notification.latest")}
          className="fixed inset-x-4 top-16 z-50 rounded-xl border bg-white p-4 shadow-overlay sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[390px]"
        >
          <h2 className="font-semibold">{t("notification.latest")}</h2>
          <div className="mt-4 max-h-[55dvh] space-y-3 overflow-y-auto">
            {state.loading ? (
              <p role="status">{t("common.loading")}</p>
            ) : state.error ? (
              <p role="alert">
                {t("notification.loadError")}{" "}
                <button onClick={() => void state.refresh()} className="text-blush">
                  {t("error.retry")}
                </button>
              </p>
            ) : state.latest?.data.length ? (
              state.latest.data.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onNavigate={() => setOpen(false)}
                />
              ))
            ) : (
              <p className="text-sm text-stone-500">{t("notification.empty")}</p>
            )}
          </div>
          {state.mutationError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {t("notification.saveError")}
            </p>
          )}
          <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm font-semibold text-blush">
            <button
              disabled={state.busy || !count || state.error}
              onClick={() => void state.markAllRead()}
              className="disabled:opacity-50"
            >
              {t("notification.markAllRead")}
            </button>
            {role !== "admin" && (
              <Link href={`/${role}/notifications`} onClick={() => setOpen(false)}>
                {t("notification.viewAll")}
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
