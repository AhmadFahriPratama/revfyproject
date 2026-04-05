import { notFound } from "next/navigation";

import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { TryoutStartPanel } from "@/components/tryout-start-panel";
import { getTryoutDetail, getTryoutDetailParams } from "@/lib/dataset";
import { dailyTryoutTokenChannelUrl } from "@/lib/marketing";
import { getServerSession } from "@/lib/server-auth";
import { getTryoutAccessStatus } from "@/lib/server-tryout-access";
import type { AccessTier } from "@/lib/catalog";

export const revalidate = 300;

export function generateStaticParams() {
  return getTryoutDetailParams();
}

export default async function TryoutDetailPage({ params }: { params: Promise<{ tier: string; slug: string }> }) {
  const { tier, slug } = await params;

  if (tier !== "gratis" && tier !== "berbayar") {
    notFound();
  }

  const detail = await getTryoutDetail(tier as AccessTier, slug);

  if (!detail) {
    notFound();
  }

  const session = await getServerSession();
  const access = await getTryoutAccessStatus(session, tier as AccessTier, slug);

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow={tier === "gratis" ? "Tryout Gratis Detail" : "Tryout Berbayar Detail"}
        title={detail.title}
        description="Halaman ini menampilkan ringkasan set, contoh soal, dan tombol untuk mulai simulasi agar Anda bisa menilai set sebelum mengerjakannya."
        badges={[detail.entry.category, detail.entry.mode, detail.focus]}
        actions={[
          { label: "Kembali ke lineup tryout", href: "/tryout", tone: "ghost" },
        ]}
        stats={[
          { label: "Tier", value: tier.toUpperCase() },
          { label: "Questions", value: detail.totalQuestions },
          { label: "Duration", value: detail.duration },
        ]}
      >
        <HeroModel variant={tier === "gratis" ? "core" : "premium"} label={`${detail.entry.category} detail tryout`} />
      </PageIntro>

      <TryoutStartPanel tier={tier as AccessTier} slug={slug} title={detail.title} channelUrl={dailyTryoutTokenChannelUrl} initialAccess={access} />

      <section className="content-grid content-grid--three">
        {detail.extraMeta.map((item) => (
          <article key={`${item.label}-${item.value}`} className="glass-panel stat-surface">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="stack-md">
        <div className="section-heading">
          <span className="eyebrow">Contoh Soal</span>
          <h2>Cuplikan soal dari file asli</h2>
        </div>
        <div className="content-grid content-grid--two">
          {detail.sampleQuestions.map((question, index) => (
            <article key={question.id} className="glass-panel card-surface">
              <span className="card-tag">Soal {index + 1}</span>
              <h3>{question.question}</h3>
              {question.topic || question.difficulty ? (
                <div className="meta-row meta-row--tight">
                  {question.topic ? <span>{question.topic}</span> : null}
                  {question.difficulty ? <span>{question.difficulty}</span> : null}
                </div>
              ) : null}
              <div className="option-list">
                {question.options.map(([key, value]) => (
                  <div key={key} className="option-row">
                    <strong>{key}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <div className="answer-box">
                <strong>Jawaban: {question.answer}</strong>
                {question.tip ? <p>Trik: {question.tip}</p> : null}
                <p>{question.explanation}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Lanjut Belajar</span>
          <h2>Lanjutkan ke simulasi atau pilih paket belajar</h2>
          <p>Setelah melihat detail set, Anda bisa langsung mulai simulasi atau membuka halaman paket belajar.</p>
        </div>
        <DepthButton href="/subscription" tone="ghost">
          Buka subscription
        </DepthButton>
      </section>
    </div>
  );
}
