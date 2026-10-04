"use client";
import { Pagination } from "@/shared/components/navigation/Pagination";
import { useCallback, useEffect, useState } from "react";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppSelect } from "@/shared/components/ui/FormFields";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { notificationRepository } from "./repository";
import { useNotifications } from "./NotificationProvider";
import { NotificationItem } from "./NotificationItem";
import type { NotificationPageData } from "./types";

export function NotificationPage() {
  const { t } = useTranslation();
  const state = useNotifications();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { revision } = state;
  const loader = useCallback(() => {
    void revision;
    return notificationRepository.list({
      pageNumber: page,
      pageSize: 10,
      isRead: filter === "all" ? undefined : filter === "read",
    });
  }, [page, filter, revision]);
  const resource = useAsyncResource<NotificationPageData | null>(loader, { initialData: null });
  const total = resource.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (resource.data?.pageSize || 10)));
  useEffect(() => {
    if (!resource.loading && !resource.error && resource.data && page > pages) setPage(pages);
  }, [page, pages, resource.loading, resource.error, resource.data]);
  return (
    <FeaturePage title={t("navigation.notifications")} description={t("notification.description")}>
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border bg-white p-4">
        <AppSelect
          label={t("notification.filter")}
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">{t("notification.all")}</option>
          <option value="unread">{t("notification.unread")}</option>
          <option value="read">{t("notification.read")}</option>
        </AppSelect>
        <AppButton
          variant="secondary"
          disabled={state.busy || !state.latest?.unreadCount || state.error}
          loading={state.busy}
          onClick={() => void state.markAllRead()}
        >
          {t("notification.markAllRead")}
        </AppButton>
      </div>
      {state.mutationError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {t("notification.saveError")}
        </p>
      )}
      {resource.loading ? (
        <LoadingSkeleton />
      ) : resource.error ? (
        <ErrorState retry={() => void resource.reload()} />
      ) : (
        <>
          {resource.data?.data.length ? (
            <div className="grid gap-3">
              {resource.data.data.map((item) => (
                <NotificationItem notification={item} key={item.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("notification.empty")}
              description={t("notification.emptyDescription")}
            />
          )}
          <Pagination
            label="Halaman notifikasi"
            page={page}
            totalPages={pages}
            onPageChange={setPage}
          />
        </>
      )}
    </FeaturePage>
  );
}
