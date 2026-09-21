"use client";
import Link from "next/link";
import { useAuth } from "@/features/auth/useAuth";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { useNotifications } from "./NotificationProvider";
import { notificationDestination } from "./rules";
import type { AppNotification } from "./types";

export function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: AppNotification;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const { busy, markRead } = useNotifications();
  const href = notificationDestination(notification.actionUrl, user?.role.toLowerCase() ?? "");
  const date = new Date(notification.createdAt);
  return (
    <article
      className={`rounded-xl border p-4 ${notification.isRead ? "bg-white" : "border-rose-100 bg-rose-50"}`}
    >
      <div className="flex items-start gap-2">
        {!notification.isRead && (
          <span
            aria-label={t("notification.unread")}
            className="mt-1.5 size-2 shrink-0 rounded-full bg-blush"
          />
        )}
        <h3 className="break-words text-sm font-semibold">{notification.title}</h3>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-600">
        {notification.message}
      </p>
      {!Number.isNaN(date.getTime()) && (
        <time dateTime={notification.createdAt} className="mt-2 block text-xs text-stone-500">
          {new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(date)}
        </time>
      )}
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-blush">
        {!notification.isRead && (
          <button
            disabled={busy}
            onClick={() => void markRead(notification.id)}
            className="disabled:opacity-50"
          >
            {t("notification.markRead")}
          </button>
        )}
        {href && (
          <Link
            href={href}
            onClick={() => {
              if (!notification.isRead) void markRead(notification.id);
              onNavigate?.();
            }}
          >
            {t("notification.viewDetail")}
          </Link>
        )}
      </div>
    </article>
  );
}
