"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/useAuth";
import { notificationRepository } from "./repository";
import type { NotificationPageData } from "./types";

interface NotificationContextValue {
  latest: NotificationPageData | null;
  loading: boolean;
  error: boolean;
  busy: boolean;
  mutationError: boolean;
  revision: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
}
const Context = createContext<NotificationContextValue | null>(null);
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return (
    <NotificationSession key={session?.accessToken ?? "anonymous"} enabled={Boolean(session)}>
      {children}
    </NotificationSession>
  );
}
function NotificationSession({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [latest, setLatest] = useState<NotificationPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState(false);
  const [revision, setRevision] = useState(0);
  const inFlight = useRef<Promise<void> | null>(null);
  const mutating = useRef(false);
  const generation = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const refresh = useCallback(() => {
    if (!enabled) return Promise.resolve();
    if (inFlight.current) return inFlight.current;
    const current = generation.current;
    const operation = (async () => {
      try {
        const data = await notificationRepository.list({ pageNumber: 1, pageSize: 5 });
        if (alive.current && current === generation.current) {
          setLatest(data);
          setError(false);
        }
      } catch {
        if (alive.current && current === generation.current) setError(true);
      } finally {
        if (alive.current) setLoading(false);
      }
    })();
    inFlight.current = operation;
    void operation.finally(() => {
      if (inFlight.current === operation) inFlight.current = null;
    });
    return operation;
  }, [enabled]);
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
    const update = () => {
      if (document.visibilityState === "visible" && !mutating.current) {
        setRevision((value) => value + 1);
        void refresh();
      }
    };
    const timer = window.setInterval(update, 60_000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled, refresh]);
  const mutate = async (id?: string) => {
    if (!enabled || mutating.current) return false;
    mutating.current = true;
    setBusy(true);
    setMutationError(false);
    generation.current += 1;
    try {
      if (id) await notificationRepository.markRead(id);
      else await notificationRepository.markAllRead();
      if (!alive.current) return false;
      setLatest((current) =>
        current
          ? {
              ...current,
              unreadCount: id
                ? Math.max(0, current.unreadCount - (current.data.some((item) => item.id === id && !item.isRead) ? 1 : 0))
                : 0,
              data: current.data.map((item) =>
                !id || item.id === id ? { ...item, isRead: true } : item,
              ),
            }
          : current,
      );
      setRevision((value) => value + 1);
      await inFlight.current;
      await refresh();
      return true;
    } catch {
      if (alive.current) setMutationError(true);
      return false;
    } finally {
      mutating.current = false;
      if (alive.current) setBusy(false);
    }
  };
  return (
    <Context.Provider
      value={{
        latest,
        loading,
        error,
        busy,
        mutationError,
        revision,
        refresh,
        markRead: (id) => mutate(id),
        markAllRead: () => mutate(),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useNotifications() {
  const context = useContext(Context);
  if (!context) throw new Error("NotificationProvider is required");
  return context;
}
