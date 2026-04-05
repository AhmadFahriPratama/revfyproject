"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { DepthButton } from "@/components/depth-button";
import { LogoMark } from "@/components/logo-mark";
import { useAuth } from "@/lib/auth";

const focusOptions = ["UTBK", "CPNS", "SMK/SMA", "SMP", "Tryout Camp"];

export function LoginPanel({ mode = "login" }: { mode?: "login" | "sign-in" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, session, login, register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [focus, setFocus] = useState(focusOptions[0]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const normalizedUsername = username.trim().toLowerCase();
  const requiresAuthenticator = mode === "login" && normalizedUsername === "balrev";
  const nextLink = searchParams.get("next");
  const title = mode === "login" ? "Masuk ke akun Anda" : "Buat akun baru dengan cepat";
  const description =
    mode === "login"
      ? "Masuk untuk membuka dashboard, progres belajar, bookmark, dan akses tryout yang sudah aktif."
      : "Buat akun Revfy untuk menyimpan progres, memakai token tryout, dan lanjut belajar dari perangkat mana pun.";
  const primaryLabel =
    mode === "login" ? (requiresAuthenticator ? "Verifikasi & masuk" : "Masuk ke panel") : "Buat akun sekarang";
  const alternateHref = `${mode === "login" ? "/sign-in" : "/login"}${nextLink ? `?next=${encodeURIComponent(nextLink)}` : ""}`;

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
      const nextSession =
        mode === "login" ? await login(username, password, focus, authCode) : await register(username, password, focus);

      router.push(nextSession.role === "admin" ? "/admin" : nextLink || "/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : mode === "login" ? "Login gagal." : "Pembuatan akun gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell auth-shell--single">
      <div className="auth-copy glass-panel">
        <LogoMark subtitle={mode === "login" ? "Masuk ke akun Revfy" : "Mulai akun Revfy baru"} />
        <span className="eyebrow">{mode === "login" ? "Login" : "Sign In"}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="chip-row">
          <span className="tone-chip">Ringkas</span>
          <span className="tone-chip">Mobile friendly</span>
          <span className="tone-chip">Tanpa 3D</span>
        </div>
        <div className="auth-helper">
          <strong>{requiresAuthenticator ? "Mode admin aktif" : mode === "login" ? "Masuk ke akun lama" : "Pendaftaran akun baru"}</strong>
          <p>
            {requiresAuthenticator
              ? "Username balrev membutuhkan password admin dan 6 digit kode dari Google Authenticator."
              : mode === "login"
                ? "Gunakan username dan password yang sudah terdaftar. Fokus belajar bisa diperbarui saat masuk."
                : "Pilih username, password, lalu fokus belajar awal Anda untuk mulai memakai Revfy."}
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
            <DepthButton type="submit">{submitting ? "Memproses..." : primaryLabel}</DepthButton>
            <DepthButton href={alternateHref} tone="ghost">
              {mode === "login" ? "Buat akun baru" : "Sudah punya akun"}
            </DepthButton>
          </div>
        </form>
      </div>
    </section>
  );
}
