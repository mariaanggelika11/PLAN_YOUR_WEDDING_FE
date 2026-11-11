import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { createApi, type Api } from "../api/client";
import { readSession, storeSession } from "./storage";
import { validSession } from "../domain/rules";
import type { Session } from "../domain/contracts";

interface AuthContext {
  session: Session | null;
  ready: boolean;
  storageError: boolean;
  api: Api;
  authenticate: (session: Session, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  retryStorage: () => void;
}
const Context = createContext<AuthContext | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const current = useRef<Session | null>(null);
  const change = useCallback((value: Session | null) => {
    current.current = value;
    setSession(value);
  }, []);
  const expire = useCallback(
    (token?: string) => {
      if (token && token !== current.current?.accessToken) return;
      change(null);
      void storeSession(null).catch(() => setStorageError(true));
    },
    [change],
  );
  const api = useMemo(
    () =>
      createApi({
        baseUrl: process.env.EXPO_PUBLIC_API_URL || "https://api-planyourwedding.bulmar.tech",
        getSession: () => current.current,
        onUnauthorized: expire,
      }),
    [expire],
  );
  const retryStorage = useCallback(() => {
    setReady(false);
    setStorageError(false);
    void readSession()
      .then(change)
      .catch(() => {
        change(null);
        setStorageError(true);
      })
      .finally(() => setReady(true));
  }, [change]);
  useEffect(retryStorage, [retryStorage]);
  useEffect(() => {
    const check = () => {
      if (current.current?.expiresAt && current.current.expiresAt <= Date.now())
        expire(current.current.accessToken);
    };
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    const remaining = session?.expiresAt ? session.expiresAt - Date.now() : undefined;
    const timer =
      remaining !== undefined
        ? setTimeout(check, Math.max(0, Math.min(remaining, 2_147_483_647)))
        : undefined;
    return () => {
      listener.remove();
      if (timer) clearTimeout(timer);
    };
  }, [session, expire]);
  const authenticate = useCallback(
    async (value: Session, remember: boolean) => {
      if (!validSession(value)) throw new Error("SESSION_EXPIRED");
      await storeSession(remember ? value : null);
      change(value);
    },
    [change],
  );
  const logout = useCallback(async () => {
    const request = api("/auth/logout", { method: "POST" }).catch(() => undefined);
    change(null);
    try {
      await storeSession(null);
    } catch {
      setStorageError(true);
    }
    void request;
  }, [api, change]);
  return (
    <Context.Provider
      value={{ session, ready, storageError, api, authenticate, logout, retryStorage }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider missing");
  return context;
}
