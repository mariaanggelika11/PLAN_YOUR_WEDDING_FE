"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getOrderMessages, readOrderMessages, sendOrderMessage } from "../messagesApi";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { apiErrorCode } from "@/shared/api/errorCodes";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppTextarea } from "@/shared/components/ui/FormFields";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { PortfolioImage } from "@/features/profile/components/portfolio/Portfolio";
import { formatDateTime } from "@/shared/utils/formatDate";
export function OrderConversation({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="rounded-xl border bg-white p-5"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer font-semibold">Percakapan pesanan</summary>
      {open && <ConversationBody key={orderId} orderId={orderId} />}
    </details>
  );
}
function ConversationBody({ orderId }: { orderId: string }) {
  const [pages, setPages] = useState(1);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0);
  const [closed, setClosed] = useState(false);
  const [readError, setReadError] = useState("");
  const action = useAsyncAction();
  const busy = useRef(false);
  const loader = useCallback(async () => {
    const results = await Promise.all(
      Array.from({ length: pages }, (_, i) => getOrderMessages(orderId, i + 1)),
    );
    const messages = new Map(
      results
        .slice()
        .reverse()
        .flatMap((page) => page.data)
        .map((item) => [item.id, item]),
    );
    return { ...results[0], data: [...messages.values()] };
  }, [orderId, pages]);
  const resource = useAsyncResource(loader, { initialData: null });
  const reload = resource.reload;
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible" || busy.current) return;
      busy.current = true;
      try {
        await reload();
      } finally {
        busy.current = false;
      }
    };
    const interval = window.setInterval(() => void refresh(), 20000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [reload]);
  useEffect(() => {
    if (!resource.data?.unreadCount || document.visibilityState !== "visible") return;
    let active = true;
    void readOrderMessages(orderId)
      .then(() => {
        if (active) setReadError("");
      })
      .catch(() => {
        if (active) setReadError("Status baca belum tersimpan. Muat ulang untuk mencoba lagi.");
      });
    return () => {
      active = false;
    };
  }, [orderId, resource.data]);
  const canSend = resource.data?.canSend && !resource.error && !closed;
  return (
    <div className="mt-4 grid min-w-0 gap-4">
      <div className="flex flex-wrap gap-2">
        <AppButton variant="secondary" disabled={resource.loading} onClick={() => void reload()}>
          Muat ulang pesan
        </AppButton>
        <AppButton
          variant="secondary"
          disabled={
            resource.loading ||
            !resource.data ||
            pages * resource.data.pageSize >= resource.data.total
          }
          onClick={() => setPages((value) => value + 1)}
        >
          Muat pesan lama
        </AppButton>
      </div>
      {readError && (
        <p role="status" className="text-xs text-amber-700">
          {readError}
        </p>
      )}
      {resource.error ? (
        <ErrorState description={resource.error} retry={() => void reload()} />
      ) : !resource.data ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid max-h-[480px] gap-3 overflow-y-auto" aria-live="polite">
          {!resource.data.data.length && (
            <p className="text-sm text-stone-500">
              Belum ada pesan. Diskusikan kebutuhan acara di sini.
            </p>
          )}
          {resource.data.data.map((item) => (
            <article
              key={item.id}
              className={`w-fit max-w-[90%] min-w-0 rounded-xl p-3 ${item.isMine ? "ml-auto bg-rose-50" : "bg-stone-100"}`}
            >
              <p className="text-xs font-semibold">
                {item.sender.fullname} · {item.senderRole}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">
                {item.message}
              </p>
              {!!item.imageAttachmentIds.length && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {item.imageAttachmentIds.map((id) => (
                    <PortfolioImage key={id} id={id} alt="Lampiran percakapan pesanan" />
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-stone-500">
                {formatDateTime(item.createdAt)}
                {item.isMine ? (item.isRead ? " · Dibaca ✓✓" : " · Terkirim ✓") : ""}
              </p>
            </article>
          ))}
        </div>
      )}
      {!canSend && resource.data && (
        <p className="text-sm text-stone-500">
          Percakapan ini hanya dapat dibaca. Pengiriman pesan tidak tersedia untuk status pesanan
          atau peran Anda saat ini.
        </p>
      )}
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSend || (!message.trim() && !files.length)) return;
          const result = await action.run(() => sendOrderMessage(orderId, message, files));
          if (result.success) {
            setMessage("");
            setFiles([]);
            setFileKey((key) => key + 1);
            await reload();
          } else if (apiErrorCode(result.error) === "ORDER_CLOSED") {
            setClosed(true);
            await reload();
          }
        }}
      >
        <AppTextarea
          label="Pesan"
          value={message}
          maxLength={2000}
          disabled={!canSend || action.loading}
          onChange={(event) => setMessage(event.target.value)}
        />
        <label className="grid gap-2 text-sm">
          Lampiran gambar (maksimal 5, masing-masing 5 MB)
          <input
            key={fileKey}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={!canSend || action.loading}
            className="w-full min-w-0 text-xs"
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              if (
                selected.length > 5 ||
                selected.some(
                  (file) =>
                    file.size > 5 * 1024 * 1024 ||
                    !["image/jpeg", "image/png", "image/webp"].includes(file.type),
                )
              ) {
                action.setError(
                  "Pilih maksimal 5 gambar JPG, PNG, atau WebP, masing-masing maksimal 5 MB.",
                );
                setFiles([]);
                setFileKey((key) => key + 1);
                return;
              }
              action.clearFeedback();
              setFiles(selected);
            }}
          />
        </label>
        {action.error && (
          <p role="alert" className="text-sm text-red-700">
            {action.error}
          </p>
        )}
        <AppButton
          type="submit"
          className="w-fit"
          loading={action.loading}
          disabled={!canSend || (!message.trim() && !files.length)}
        >
          Kirim pesan
        </AppButton>
      </form>
    </div>
  );
}
