"use client";
import { useEffect, useState } from "react";
import { getSession, logout as logoutSession } from "@/services/authService";
import type { AuthSession } from "@/types/auth";

// TODO API: Baca session, refresh token, dan role user dari auth backend.
export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const sync = () => {
      setSession(getSession());
      setIsLoading(false);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("pyw-auth-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pyw-auth-change", sync);
    };
  }, []);
  return {
    user: session?.user ?? null,
    session,
    isLoading,
    isAuthenticated: Boolean(session),
    logout: logoutSession,
  };
}
