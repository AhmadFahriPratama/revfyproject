"use client";

import { useEffect, useState } from "react";

type Summary = {
  users: number;
  sessions: number;
  progress: number;
  attempts: number;
  subscriptions: number;
};

export function AdminDatabaseOverview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState("Memeriksa koneksi database...");

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        const response = await fetch("/api/admin/summary", {
          cache: "no-store",
        });

        if (cancelled) {
          return;
        }

        if (response.status === 503) {
          setStatus("Database belum dikonfigurasi. Panel ini akan aktif penuh setelah MySQL/MariaDB cPanel tersambung.");
          return;
        }

        if (!response.ok) {
          setStatus("Ringkasan database tidak bisa dimuat saat ini.");
          return;
        }

        const payload = (await response.json()) as { ok: boolean; summary: Summary };
        setSummary(payload.summary);
        setStatus("Ringkasan database aktif.");
      } catch {
        if (!cancelled) {
          setStatus("Gagal menghubungi backend database.");
        }
      }
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary) {
    return (
      <section className="glass-panel card-surface">
        <div className="section-heading">
          <span className="eyebrow">Database Pulse</span>
          <h2>Status integrasi database</h2>
        </div>
        <p>{status}</p>
      </section>
    );
  }

  return (
    <section className="stack-md">
      <div className="section-heading">
        <span className="eyebrow">Database Pulse</span>
        <h2>Stat inti dari database aplikasi</h2>
      </div>
      <div className="analytics-grid">
        <article className="glass-panel stat-surface">
          <span>Users</span>
          <strong>{summary.users}</strong>
        </article>
        <article className="glass-panel stat-surface">
          <span>Active Sessions</span>
          <strong>{summary.sessions}</strong>
        </article>
        <article className="glass-panel stat-surface">
          <span>Saved Progress</span>
          <strong>{summary.progress}</strong>
        </article>
        <article className="glass-panel stat-surface">
          <span>Attempts</span>
          <strong>{summary.attempts}</strong>
        </article>
      </div>
      <article className="glass-panel card-surface">
        <div className="list-row">
          <strong>Active Subscriptions</strong>
          <span>{summary.subscriptions}</span>
        </div>
        <p>{status}</p>
      </article>
    </section>
  );
}
