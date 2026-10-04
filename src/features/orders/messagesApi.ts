import { authenticatedDataRequest } from "@/shared/api/authenticatedApiClient";
export interface OrderMessage {
  id: string;
  message: string;
  senderRole: string;
  sender: { id: number; fullname: string };
  isMine: boolean;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  imageAttachmentIds: string[];
}
export interface MessagePage {
  data: OrderMessage[];
  total: number;
  pageNumber: number;
  pageSize: number;
  unreadCount: number;
  canSend: boolean;
}
const endpoint = (id: string) => `/orders/${encodeURIComponent(id)}/messages`;
export const getOrderMessages = (id: string, pageNumber = 1) =>
  authenticatedDataRequest<MessagePage>(`${endpoint(id)}?pageNumber=${pageNumber}&pageSize=30`);
export const readOrderMessages = (id: string) =>
  authenticatedDataRequest<{ updated: number }>(`${endpoint(id)}/read`, { method: "PUT" });
export function sendOrderMessage(id: string, message: string, images: File[]) {
  const body = new FormData();
  if (message.trim()) body.set("message", message.trim());
  images.forEach((image) => body.append("images", image));
  return authenticatedDataRequest<OrderMessage>(endpoint(id), { method: "POST", body });
}
