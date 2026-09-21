import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import { notificationQuery } from "./rules";
import type { AppNotification, NotificationPageData, NotificationQuery } from "./types";
const paths = API_ROUTES.notifications;
export const notificationRepository = {
  list: (query: NotificationQuery) =>
    authenticatedDataRequest<NotificationPageData>(`${paths.root}?${notificationQuery(query)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    }),
  markRead: (id: string) =>
    authenticatedDataRequest<AppNotification>(paths.read(id), {
      method: "PUT",
      signal: AbortSignal.timeout(20_000),
    }),
  markAllRead: () =>
    authenticatedDataRequest<{ updated: number }>(paths.readAll, {
      method: "PUT",
      signal: AbortSignal.timeout(20_000),
    }),
};
