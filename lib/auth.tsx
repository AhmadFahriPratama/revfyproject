"use client";

import { createContext, useContext, useEffect, useState } from "react";

import type { Session, SessionPlan, SessionRole } from "@/lib/auth-types";
export type { Session, SessionPlan, SessionRole } from "@/lib/auth-types";

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  source: "backend" | "local";
  login: (username: string, password: string, focus: string) => Promise<Session>;
  logout: () => Promise<void>;
  setPlan: (plan: SessionPlan) => Promise<void>;
};

const storageKey = "revfy.session.v1";

const AuthContext = createContext<AuthContextValue | null>(null);

function createSession(username: string, focus: string): Session {
  const normalized = username.trim();
  const admin = normalized.toLowerCase() === "balrev";

  return {
    username: normalized,
    displayName: admin ? "Balrev Control" : normalized,
    role: admin ? "admin" : "student",
    plan: admin ? "elite" : "free",
    focus,
    streak: admin ? 21 : 7,
  };
}

function readLocalSession() {
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function persistLocalSession(session: Session | null) {
  if (!session) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [source, setSource] = useState<"backend" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    const initializeSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (cancelled) {
          return;
        }

        if (response.ok) {
          const payload = (await response.json()) as { ok: boolean; session: Session };
          setSession(payload.session);
          setSource("backend");
          setReady(true);
          return;
        }

        if (response.status !== 503) {
          setSession(null);
          setSource("backend");
          setReady(true);
          return;
        }
      } catch {
        // Fallback to local session below.
      }

      const localSession = readLocalSession();

      if (!cancelled) {
        setSession(localSession);
        setSource("local");
        setReady(true);
      }
    };

    void initializeSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (username: string, password: string, focus: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          focus,
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as { ok: boolean; session: Session };
        setSession(payload.session);
        setSource("backend");
        persistLocalSession(null);
        return payload.session;
      }

      if (response.status !== 503) {
        const payload = (await response.json()) as { ok: boolean; error?: string };
        throw new Error(payload.error ?? "Login gagal.");
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Failed to fetch") {
        throw error;
      }
    }

    const nextSession = createSession(username, focus);
    setSession(nextSession);
    setSource("local");
    persistLocalSession(nextSession);
    return nextSession;
  };

  const logout = async () => {
    if (source === "backend") {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
      } catch {
        // Ignore network errors and clear client state.
      }
    }

    setSession(null);
    persistLocalSession(null);
  };

  const setPlan = async (plan: SessionPlan) => {
    if (source === "backend") {
      const response = await fetch("/api/subscription", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const payload = (await response.json()) as { ok: boolean; session: Session };
        setSession(payload.session);
        return;
      }
    }

    setSession((current) => {
      if (!current) {
        return current;
      }

      const updated = { ...current, plan };
      persistLocalSession(updated);
      return updated;
    });
  };

  return <AuthContext.Provider value={{ ready, session, source, login, logout, setPlan }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
