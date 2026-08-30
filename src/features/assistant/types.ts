import type { AppRole } from "@/shared/config/routes";

export interface AssistantContext {
  pathname: string;
  role: Exclude<AppRole, "admin">;
  orderId?: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AskAssistantPayload {
  context: AssistantContext;
  conversationId?: string;
  message: string;
}
