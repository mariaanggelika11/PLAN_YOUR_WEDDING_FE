import type { Order } from "./types.ts";

/** The API owns the deadline; never infer completion from a client clock. */
export function confirmationDeadline(order: Pick<Order, "status" | "autoCompleteAt">) {
  if (order.status !== "WAITING_CUSTOMER_CONFIRMATION" || !order.autoCompleteAt) return null;
  const timestamp = Date.parse(order.autoCompleteAt);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function confirmationTimeLeft(deadline: number, now: number) {
  const minutes = Math.ceil((deadline - now) / 60_000);
  if (minutes <= 0) return "Batas waktu konfirmasi telah lewat.";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return days > 0
    ? `Sisa waktu ${days} hari ${hours} jam.`
    : hours > 0
      ? `Sisa waktu ${hours} jam ${minutes % 60} menit.`
      : `Sisa waktu ${minutes} menit.`;
}

export function conversationClosedReason(status?: Order["status"]) {
  if (status === "REJECTED_BY_VENDOR")
    return "Pesanan ditolak oleh vendor. Anda tetap dapat membaca riwayat percakapan, tetapi tidak dapat mengirim pesan baru.";
  if (status === "CANCELLED")
    return "Pesanan telah dibatalkan. Anda tetap dapat membaca riwayat percakapan, tetapi tidak dapat mengirim pesan baru.";
  return null;
}
