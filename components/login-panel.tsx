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
  const [authCode, setAuthCode] = useState("");
  const [focus, setFocus] = useState(focusOptions[0]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const normalizedUsername = username.trim().toLowerCase();
  const requiresAuthenticator = normalizedUsername === "balrev";

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

    if (requiresAuthenticator && authCode.trim().length !== 6) {
      setError("Masukkan 6 digit kode Google Authenticator untuk akun admin.");
      return;
    }

    setSubmitting(true);

    try {
      const nextSession = await login(username, password, focus, authCode);
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
        <h1>Masuk dengan alur yang ringkas</h1>
        <p>Akses dashboard, bookmark, dan riwayat tryout dari satu halaman login yang lebih sederhana di desktop maupun mobile.</p>
        <div className="chip-row">
          <span className="tone-chip">Ringkas</span>
          <span className="tone-chip">Aman</span>
          <span className="tone-chip">Responsif</span>
        </div>
        <div className="auth-helper">
          <strong>{requiresAuthenticator ? "Mode admin aktif" : "Login belajar biasa"}</strong>
          <p>
            {requiresAuthenticator
              ? "Username balrev membutuhkan password admin dan 6 digit kode dari Google Authenticator."
              : "Gunakan username dan password untuk masuk. Fokus belajar bisa diubah kapan saja setelah login."}
          </p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__grid">
            <label className="field-block">
              <span>Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="contoh: revfyuser" autoComplete="username" />
            </label>
            <label className="field-block">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="masukkan password login"
                autoComplete="current-password"
              />
            </label>
          </div>
          {requiresAuthenticator ? (
            <label className="field-block">
              <span>Kode Google Authenticator</span>
              <input
                value={authCode}
                onChange={(event) => setAuthCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 digit kode"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <small className="field-hint">Masukkan kode 6 digit yang sedang aktif dari aplikasi Google Authenticator.</small>
            </label>
          ) : null}
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
            <DepthButton type="submit">{submitting ? "Memproses..." : requiresAuthenticator ? "Verifikasi & masuk" : "Masuk ke panel"}</DepthButton>
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
