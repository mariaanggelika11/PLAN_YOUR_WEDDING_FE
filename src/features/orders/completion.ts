import { translateInterfaceText, type TranslationVariables } from "../../shared/i18n/translate.ts";
import type { Order } from "./types.ts";

/** The API owns the deadline; never infer completion from a client clock. */
export function confirmationDeadline(order: Pick<Order, "status" | "autoCompleteAt">) {
  if (order.status !== "WAITING_CUSTOMER_CONFIRMATION" || !order.autoCompleteAt) return null;
  const timestamp = Date.parse(order.autoCompleteAt);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function confirmationTimeLeft(deadline: number, now: number, locale: "id" | "en" = "id") {
  const translateUI = (text: string, variables?: TranslationVariables) =>
    translateInterfaceText(text, locale, variables);
  const minutes = Math.ceil((deadline - now) / 60_000);
  if (minutes <= 0) return translateUI("Batas waktu konfirmasi telah lewat.");
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return days > 0
    ? translateUI("Sisa waktu {0} hari {1} jam.", { 0: days, 1: hours })
    : hours > 0
      ? translateUI("Sisa waktu {0} jam {1} menit.", { 0: hours, 1: minutes % 60 })
      : translateUI("Sisa waktu {0} menit.", { 0: minutes });
}

export function conversationClosedReason(status?: Order["status"]) {
  if (status === "REJECTED_BY_VENDOR")
    return "Pesanan ditolak oleh vendor. Anda tetap dapat membaca riwayat percakapan, tetapi tidak dapat mengirim pesan baru.";
  if (status === "CANCELLED")
    return "Pesanan telah dibatalkan. Anda tetap dapat membaca riwayat percakapan, tetapi tidak dapat mengirim pesan baru.";
  return null;
}
