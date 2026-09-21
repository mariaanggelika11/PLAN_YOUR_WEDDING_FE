export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceTable: string | null;
  referenceId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  active: boolean;
  createdAt: string;
}
export interface NotificationQuery {
  pageNumber: number;
  pageSize: number;
  isRead?: boolean;
}
export interface NotificationPageData {
  data: AppNotification[];
  total: number;
  pageNumber: number;
  pageSize: number;
  unreadCount: number;
}
