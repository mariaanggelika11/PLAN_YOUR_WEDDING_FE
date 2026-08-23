"use client";

import { AppButton } from "@/shared/components/ui/AppButton";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import { AlertTriangle, Check, CircleX, Info, X, type LucideIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PopupVariant = "success" | "warning" | "error" | "info";

interface PopupOptions {
  message: string;
  title?: string;
  variant?: PopupVariant;
}

interface NoticeOptions extends PopupOptions {
  duration?: number;
}

interface ConfirmOptions extends PopupOptions {
  cancelLabel?: string;
  confirmLabel?: string;
  requireReason?: boolean;
  reasonLabel?: string;
}

export interface PopupConfirmResult {
  confirmed: boolean;
  reason?: string;
}

interface NoticePopup extends NoticeOptions {
  id: number;
  kind: "notice";
}

interface ConfirmPopup extends ConfirmOptions {
  id: number;
  kind: "confirm";
  resolve: (result: PopupConfirmResult) => void;
}

type ActivePopup = NoticePopup | ConfirmPopup;

interface PopupContextValue {
  confirm: (options: ConfirmOptions) => Promise<PopupConfirmResult>;
  error: (message: string, options?: Omit<NoticeOptions, "message" | "variant">) => void;
  info: (message: string, options?: Omit<NoticeOptions, "message" | "variant">) => void;
  notify: (options: NoticeOptions) => void;
  success: (message: string, options?: Omit<NoticeOptions, "message" | "variant">) => void;
  warning: (message: string, options?: Omit<NoticeOptions, "message" | "variant">) => void;
}

const DEFAULT_DURATION = 4000;
const PopupContext = createContext<PopupContextValue | null>(null);

const VARIANT_STYLE: Record<
  PopupVariant,
  {
    Icon: LucideIcon;
    defaultTitle: string;
    icon: string;
    iconBackground: string;
    ring: string;
  }
> = {
  success: {
    Icon: Check,
    defaultTitle: "Berhasil!",
    icon: "text-emerald-600",
    iconBackground: "bg-emerald-50",
    ring: "ring-emerald-100",
  },
  warning: {
    Icon: AlertTriangle,
    defaultTitle: "Perhatian",
    icon: "text-amber-600",
    iconBackground: "bg-amber-50",
    ring: "ring-amber-100",
  },
  error: {
    Icon: CircleX,
    defaultTitle: "Tidak dapat diproses",
    icon: "text-red-600",
    iconBackground: "bg-red-50",
    ring: "ring-red-100",
  },
  info: {
    Icon: Info,
    defaultTitle: "Informasi",
    icon: "text-sky-600",
    iconBackground: "bg-sky-50",
    ring: "ring-sky-100",
  },
};

export function PopupProvider({ children }: { children: ReactNode }) {
  const [popup, setPopup] = useState<ActivePopup | null>(null);
  const [reason, setReason] = useState("");

  const dismiss = useCallback(
    (confirmed = false) => {
      setPopup((current) => {
        if (current?.kind === "confirm") {
          current.resolve({
            confirmed,
            reason: confirmed ? reason.trim() || undefined : undefined,
          });
        }
        return null;
      });
    },
    [reason],
  );

  const notify = useCallback((options: NoticeOptions) => {
    setPopup((current) => {
      if (current?.kind === "confirm") current.resolve({ confirmed: false });
      return {
        ...options,
        duration: options.duration ?? DEFAULT_DURATION,
        id: Date.now(),
        kind: "notice",
        variant: options.variant ?? "success",
      };
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setReason("");
    return new Promise<PopupConfirmResult>((resolve) => {
      setPopup((current) => {
        if (current?.kind === "confirm") current.resolve({ confirmed: false });
        return {
          ...options,
          id: Date.now(),
          kind: "confirm",
          resolve,
          variant: options.variant ?? "warning",
        };
      });
    });
  }, []);

  useEffect(() => {
    if (popup?.kind !== "notice" || !popup.duration) return;
    const timer = window.setTimeout(() => setPopup(null), popup.duration);
    return () => window.clearTimeout(timer);
  }, [popup]);

  const contextValue = useMemo(
    () => ({
      confirm,
      error: (message: string, options = {}) => notify({ ...options, message, variant: "error" }),
      info: (message: string, options = {}) => notify({ ...options, message, variant: "info" }),
      notify,
      success: (message: string, options = {}) =>
        notify({ ...options, message, variant: "success" }),
      warning: (message: string, options = {}) =>
        notify({ ...options, message, variant: "warning" }),
    }),
    [confirm, notify],
  );

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
      {popup && (
        <PopupView
          onCancel={() => dismiss(false)}
          onConfirm={() => dismiss(true)}
          onReasonChange={setReason}
          popup={popup}
          reason={reason}
        />
      )}
    </PopupContext.Provider>
  );
}

function PopupView({
  onCancel,
  onConfirm,
  onReasonChange,
  popup,
  reason,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  onReasonChange: (value: string) => void;
  popup: ActivePopup;
  reason: string;
}) {
  const { translateText } = useTranslation();
  const variant = popup.variant ?? "success";
  const style = VARIANT_STYLE[variant];
  const { Icon } = style;
  const isConfirm = popup.kind === "confirm";
  const isDestructive = isConfirm && variant === "error";

  return (
    <div
      aria-labelledby={`popup-title-${popup.id}`}
      aria-describedby={`popup-message-${popup.id}`}
      aria-live={variant === "error" ? "assertive" : "polite"}
      aria-modal="true"
      className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      role={isConfirm ? "alertdialog" : "dialog"}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white px-6 pb-6 pt-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:px-8">
        <button
          aria-label={translateText("Tutup popup")}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          onClick={onCancel}
          type="button"
        >
          <X size={18} />
        </button>

        <div
          className={cn(
            "mx-auto grid size-20 place-items-center rounded-full ring-8",
            style.iconBackground,
            style.ring,
          )}
        >
          <Icon className={style.icon} size={38} strokeWidth={2} />
        </div>
        <h2
          className="mt-6 text-xl font-bold tracking-tight text-slate-900"
          id={`popup-title-${popup.id}`}
        >
          {translateText(popup.title || style.defaultTitle)}
        </h2>
        <p
          className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600"
          id={`popup-message-${popup.id}`}
        >
          {translateText(popup.message)}
        </p>

        {isConfirm && popup.requireReason && (
          <div className="mt-5 text-left">
            <label
              className="mb-2 block text-sm font-semibold text-slate-800"
              htmlFor={`popup-reason-${popup.id}`}
            >
              {translateText(popup.reasonLabel ?? "Alasan")}
            </label>
            <textarea
              autoFocus
              className="min-h-28 w-full resize-y rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
              id={`popup-reason-${popup.id}`}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={translateText("Tuliskan alasan secara singkat...")}
              value={reason}
            />
          </div>
        )}

        <div className={cn("mt-7 flex gap-3", isConfirm ? "justify-center" : "justify-end")}>
          {isConfirm && (
            <AppButton className="min-w-28" onClick={onCancel} variant="secondary">
              {translateText(popup.cancelLabel ?? "Batal")}
            </AppButton>
          )}
          <AppButton
            className="min-w-28"
            disabled={isConfirm && popup.requireReason && !reason.trim()}
            onClick={onConfirm}
            variant={isDestructive ? "danger" : variant === "success" ? "success" : "primary"}
          >
            {isConfirm ? translateText(popup.confirmLabel ?? "Konfirmasi") : "OK"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) throw new Error("usePopup harus digunakan di dalam PopupProvider.");
  return context;
}

/** Compatibility component for state-driven feedback; rendered by the global popup provider. */
export function PopupMessage({
  message,
  duration = 4000,
  variant = "success",
}: {
  message: string;
  duration?: number;
  variant?: PopupVariant;
}) {
  const { notify } = usePopup();

  useEffect(() => {
    notify({ duration, message, variant });
  }, [duration, message, notify, variant]);

  return null;
}

/** Declarative confirmation trigger backed by the same global popup provider. */
export function PopupConfirm({
  trigger,
  title,
  description,
  onConfirm,
  requireReason = false,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  onConfirm?: (reason?: string) => void;
  requireReason?: boolean;
}) {
  const { confirm } = usePopup();

  async function openConfirmation() {
    const result = await confirm({
      message: description,
      requireReason,
      title,
      variant: "error",
    });
    if (result.confirmed) onConfirm?.(result.reason);
  }

  return (
    <span className="contents" onClick={() => void openConfirmation()}>
      {trigger}
    </span>
  );
}
