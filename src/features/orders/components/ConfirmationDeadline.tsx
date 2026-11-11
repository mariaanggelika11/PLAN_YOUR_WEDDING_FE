"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { confirmationDeadline, confirmationTimeLeft } from "../completion";
import { getPaymentSummary } from "../rules";
import type { Order } from "../types";
import { formatDateTime } from "@/shared/utils/formatDate";

export function ConfirmationDeadline({ order }: { order: Order }) {
  const { translateText, locale } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (order.status !== "WAITING_CUSTOMER_CONFIRMATION") return null;
  const deadline = confirmationDeadline(order);
  const paid = getPaymentSummary(order).isFullyPaid;
  return (
    <section
      className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
      aria-label={translateText("Batas konfirmasi pesanan")}
    >
      <Clock3 size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="space-y-2">
        <h2 className="font-semibold">{translateText("Menunggu konfirmasi customer")}</h2>
        <p>
          {translateText(
            "Customer memiliki waktu 7 hari sejak vendor menandai layanan selesai untuk memeriksa dan mengonfirmasi pesanan.",
          )}{" "}
        </p>
        {deadline !== null ? (
          <p className="font-medium">
            {translateText("Batas konfirmasi:")}{" "}
            <time dateTime={order.autoCompleteAt!}>
              {formatDateTime(order.autoCompleteAt!, locale)}
            </time>
            . {confirmationTimeLeft(deadline, now, locale)}
          </p>
        ) : (
          <p>{translateText("Tanggal batas konfirmasi belum tersedia dari server.")}</p>
        )}
        <p>
          {!paid
            ? translateText(
                "Masih ada tagihan yang belum lunas. Penyelesaian otomatis hanya diproses setelah seluruh pembayaran lunas.",
              )
            : deadline !== null && deadline <= now
              ? translateText(
                  "Menunggu pemrosesan otomatis oleh sistem. Status akan diperbarui setelah server menyelesaikan pesanan.",
                )
              : translateText(
                  "Jika customer tidak mengonfirmasi sampai batas waktu, sistem akan menyelesaikan pesanan secara otomatis apabila pembayaran sudah lunas.",
                )}
        </p>
        <p className="text-xs">
          {translateText("Sistem memeriksa penyelesaian otomatis setiap jam.")}
        </p>
      </div>
    </section>
  );
}
