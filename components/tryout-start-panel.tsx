"use client";

import { useEffect, useState } from "react";

import { DepthButton } from "@/components/depth-button";
import { useAuth } from "@/lib/auth";

type AccessState = {
  allowed: boolean;
  needsToken: boolean;
  reason: string;
  accessSource: "guest" | "free" | "plan" | "token" | "login";
};

export function TryoutStartPanel({
  tier,
  slug,
  title,
  channelUrl,
  initialAccess,
}: {
  tier: "gratis" | "berbayar";
  slug: string;
  title: string;
  channelUrl: string;
  initialAccess: AccessState;
}) {
  const { ready, session } = useAuth();
  const [access, setAccess] = useState(initialAccess);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAccess(initialAccess);
  }, [initialAccess]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;

    const syncAccess = async () => {
      try {
        const params = new URLSearchParams({ tier, slug });
        const response = await fetch(`/api/tryout/access?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json()) as { ok?: boolean; access?: AccessState; error?: string };

        if (cancelled || !payload.access) {
          return;
        }

        setAccess(payload.access);
      } catch {}
    };

    void syncAccess();

    return () => {
      cancelled = true;
    };
  }, [ready, session?.plan, session?.role, session?.username, slug, tier]);

  const handleRedeem = async () => {
    setSubmitting(true);
    setStatus("Memverifikasi token tryout...");

    try {
      const response = await fetch("/api/tryout/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier, slug, token }),
      });
      const payload = (await response.json()) as { ok?: boolean; access?: AccessState; error?: string; result?: { reason?: string } };

      if (!response.ok || !payload.access) {
        throw new Error(payload.error ?? "Token tryout tidak bisa dipakai.");
      }

      setAccess(payload.access);
      setToken("");
      setStatus(payload.result?.reason ?? payload.access.reason);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Token tryout tidak bisa dipakai.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass-panel card-surface start-panel">
      <div className="section-heading">
        <span className="eyebrow">Mulai Tryout</span>
        <h2>{access.allowed ? "Akses sudah siap, Anda bisa mulai sekarang" : "Aktifkan akses sebelum memulai tryout"}</h2>
      </div>
      <p>{access.reason}</p>
      <div className="meta-row">
        <span>{tier === "gratis" ? "Tryout Gratis" : "Tryout Premium"}</span>
        <span>{title}</span>
      </div>

      {access.allowed ? (
        <div className="start-panel__actions">
          <DepthButton href={`/simulasi/${tier}/${slug}`} tone="cyan">
            Mulai simulasi sekarang
          </DepthButton>
          <p className="sub-copy">Akses aktif dari {access.accessSource === "plan" ? "plan akun" : access.accessSource === "token" ? "token tryout" : "akses gratis"}.</p>
        </div>
      ) : (
        <div className="stack-md">
          {session ? (
            <div className="start-panel__redeem">
              <label className="field-block">
                <span>Masukkan token mulai tryout</span>
                <input value={token} onChange={(event) => setToken(event.target.value.toUpperCase())} placeholder="TRY-XXXXXX-XXXX" />
              </label>
              <div className="start-panel__actions">
                <DepthButton tone="cyan" onClick={() => void handleRedeem()}>
                  {submitting ? "Memakai token..." : "Aktifkan token"}
                </DepthButton>
                <DepthButton href="/subscription" tone="ghost">
                  Lihat paket belajar
                </DepthButton>
              </div>
            </div>
          ) : (
            <div className="start-panel__actions">
              <DepthButton href={`/login?next=${encodeURIComponent(`/tryout/${tier}/${slug}`)}`} tone="cyan">
                Login untuk pakai token
              </DepthButton>
            </div>
          )}

          <div className="glass-inset start-panel__channel">
            <strong>Token gratis harian dibagikan di WhatsApp channel</strong>
            <p>Ikuti channel ini untuk referral atau token gratis harian yang bisa dipakai membuka tryout premium tertentu.</p>
            <a href={channelUrl} target="_blank" rel="noreferrer" className="inline-link">
              {channelUrl}
            </a>
          </div>
        </div>
      )}

      {status ? <p className="sub-copy">{status}</p> : null}
    </section>
  );
}
