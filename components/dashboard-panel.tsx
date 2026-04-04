"use client";

import { useEffect, useState } from "react";

import { DashboardAnalytics } from "@/components/dashboard-analytics";
import { BookmarkToggle } from "@/components/bookmark-toggle";
import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { LogoMark } from "@/components/logo-mark";
import { PageIntro } from "@/components/page-intro";
import { readAttempts, type AttemptRecord } from "@/lib/attempts";
import { useAuth } from "@/lib/auth";
import { useExperience } from "@/lib/experience";

type Recommendation = {
  id: string;
  href: string;
  title: string;
  category: string;
  focus: string;
  mode: string;
  itemCount: string;
  duration: string;
};

type Milestone = {
  label: string;
  value: string;
  note: string;
};

export function DashboardPanel({ recommendations, milestones }: { recommendations: Recommendation[]; milestones: Milestone[] }) {
  const { session } = useAuth();
  const { bookmarks } = useExperience();
  const [userAttempts, setUserAttempts] = useState<AttemptRecord[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<AttemptRecord[]>([]);
  const [allAttempts, setAllAttempts] = useState<AttemptRecord[]>([]);

  useEffect(() => {
    if (!session) {
      setUserAttempts([]);
      setRecentAttempts([]);
      setAllAttempts([]);
      return;
    }

    const attempts = readAttempts();
    const personalAttempts = attempts.filter((attempt) => attempt.username.toLowerCase() === session.username.toLowerCase());

    setAllAttempts(attempts);
    setUserAttempts(personalAttempts);
    setRecentAttempts(personalAttempts.slice(0, 4));

    let cancelled = false;

    const loadBackendAttempts = async () => {
      try {
        const params = new URLSearchParams({
          limit: "24",
        });
        const response = await fetch(`/api/attempts?${params.toString()}`, {
          cache: "no-store",
        });

        if (cancelled) {
          return;
        }

        if (response.status === 503) {
          return;
        }

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { ok: boolean; attempts: AttemptRecord[] };
        const backendAttempts = Array.isArray(payload.attempts) ? payload.attempts : [];

        setUserAttempts(backendAttempts);
        setRecentAttempts(backendAttempts.slice(0, 4));
      } catch {}
    };

    void loadBackendAttempts();

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Dashboard"
        title={`Halo ${session.displayName}, dashboard kamu sudah aktif`}
        description="Panel ini menampilkan ringkasan belajar, rekomendasi tryout, dan progres supaya kamu lebih mudah lanjut ke sesi berikutnya."
        badges={[`Plan ${session.plan.toUpperCase()}`, `Fokus ${session.focus}`, `${session.streak} hari beruntun`]}
        note="Gunakan dashboard ini untuk melihat progres, membuka bookmark, dan memilih tryout berikutnya dengan lebih cepat."
        actions={[
          { label: "Buka tryout gratis", href: "/tryout/gratis" },
          { label: "Lihat paket", href: "/subscription", tone: "cyan" },
        ]}
        stats={[
          { label: "Username", value: session.username },
          { label: "Role", value: session.role.toUpperCase() },
          { label: "Fokus", value: session.focus },
        ]}
      >
        <HeroModel variant="focus" label="Dashboard belajar" />
      </PageIntro>

      <section className="content-grid content-grid--two">
        {milestones.map((milestone) => (
          <article key={milestone.label} className="glass-panel stat-surface">
            <span>{milestone.label}</span>
            <strong>{milestone.value}</strong>
            <p>{milestone.note}</p>
          </article>
        ))}
      </section>

      <section className="glass-panel banner-strip banner-strip--compact">
        <LogoMark compact subtitle="Halaman belajar pribadi" />
        <div>
          <span className="eyebrow">Bookmark</span>
          <h2>{bookmarks.length > 0 ? `${bookmarks.length} bookmark aktif` : "Belum ada bookmark aktif"}</h2>
          <p>{bookmarks.length > 0 ? "Bookmark dari materi dan tryout akan terkumpul di sini agar lebih mudah dibuka lagi." : "Gunakan tombol simpan pada materi atau tryout agar halaman favorit Anda mudah ditemukan kembali."}</p>
        </div>
      </section>

      <section className="stack-md">
        <div className="section-heading">
          <span className="eyebrow">Rekomendasi</span>
          <h2>Pilih set berikutnya tanpa pindah konteks</h2>
        </div>
        <div className="content-grid content-grid--three">
          {recommendations.map((item) => (
            <article key={item.id} className="glass-panel card-surface card-surface--interactive">
              <div className="card-surface__head">
                <span className="card-tag">{item.category}</span>
                <BookmarkToggle item={{ key: `dashboard:${item.id}`, label: item.title, href: item.href }} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.focus}</p>
              <div className="meta-row">
                <span>{item.mode}</span>
                <span>{item.itemCount} soal</span>
                <span>{item.duration}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DashboardAnalytics attempts={userAttempts} allAttempts={allAttempts} />

      <section className="stack-md">
        <div className="section-heading">
          <span className="eyebrow">Riwayat</span>
          <h2>Hasil tryout terakhir</h2>
        </div>
        <div className="content-grid content-grid--two">
          {recentAttempts.length > 0 ? (
            recentAttempts.map((attempt) => (
              <article key={attempt.id} className="glass-panel card-surface">
                <span className="card-tag">{attempt.tier === "gratis" ? "Gratis" : "Berbayar"}</span>
                <h3>{attempt.title}</h3>
                <div className="meta-row">
                  <span>{attempt.category}</span>
                  <span>{attempt.correct}/{attempt.total} benar</span>
                  <span>{attempt.accuracy}%</span>
                </div>
                <p className="sub-copy">Durasi terpakai {attempt.durationMinutes} menit · {new Date(attempt.completedAt).toLocaleString("id-ID")}</p>
              </article>
            ))
          ) : (
            <article className="glass-panel card-surface">
              <span className="card-tag">Belum ada riwayat</span>
              <h3>Mulai dari halaman detail tryout</h3>
              <p>Setelah simulasi selesai, skor dan ringkasan hasil akan tampil di dashboard ini.</p>
            </article>
          )}
        </div>
      </section>

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Lanjut Belajar</span>
          <h2>Naikkan intensitas latihan saat sudah siap</h2>
          <p>Buka tryout berbayar dan pilih paket belajar yang paling sesuai dengan target Anda.</p>
        </div>
        <DepthButton href="/tryout/berbayar" tone="ghost">
          Lihat tryout berbayar
        </DepthButton>
      </section>
    </div>
  );
}
