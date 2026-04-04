"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { LogoMark } from "@/components/logo-mark";
import { useAuth } from "@/lib/auth";

const focusOptions = ["UTBK", "CPNS", "SMK/SMA", "SMP", "Tryout Camp"];

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, session, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState(focusOptions[0]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready || !session) {
      return;
    }

    router.replace(session.role === "admin" ? "/admin" : "/dashboard");
  }, [ready, router, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Masukkan username terlebih dahulu.");
      return;
    }

    if (!password.trim()) {
      setError("Masukkan password terlebih dahulu.");
      return;
    }

    setSubmitting(true);

    try {
      const nextSession = await login(username, password, focus);
      const nextPath = searchParams.get("next");

      router.push(nextSession.role === "admin" ? "/admin" : nextPath || "/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-copy glass-panel">
        <LogoMark subtitle="Masuk ke akun Revfy" />
        <span className="eyebrow">Login</span>
        <h1>Masuk untuk lanjut belajar</h1>
        <p>Akses dashboard, bookmark, riwayat tryout, dan rekomendasi belajar dari satu akun.</p>
        <div className="chip-row">
          <span className="tone-chip">Cepat</span>
          <span className="tone-chip">Aman</span>
          <span className="tone-chip">Praktis</span>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-block">
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="contoh: revfyuser" />
          </label>
          <label className="field-block">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="masukkan password login" />
          </label>
          <label className="field-block">
            <span>Fokus saat ini</span>
            <select value={focus} onChange={(event) => setFocus(event.target.value)}>
              {focusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="hero-actions">
            <DepthButton type="submit">{submitting ? "Memproses..." : "Masuk ke panel"}</DepthButton>
            <DepthButton href="/subscription" tone="ghost">
              Lihat subscription
            </DepthButton>
          </div>
        </form>
      </div>
      <HeroModel variant="brand" label="Akses akun Revfy" />
    </section>
  );
}
