"use client";
import { getSession, logout as logoutSession } from "@/features/auth/api/authApi";
import type { AuthSession } from "@/features/auth/types/auth";
import { useEffect, useState } from "react";

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
