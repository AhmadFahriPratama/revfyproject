import { notFound } from "next/navigation";

import { DepthButton } from "@/components/depth-button";
import { SimulationRunner } from "@/components/simulation-runner";
import type { AccessTier } from "@/lib/catalog";
import { getServerSession } from "@/lib/server-auth";
import { getTryoutAccessStatus } from "@/lib/server-tryout-access";
import { getSimulationPayload } from "@/lib/dataset";

export const revalidate = 300;

export default async function SimulationPage({ params }: { params: Promise<{ tier: string; slug: string }> }) {
  const { tier, slug } = await params;

  if (tier !== "gratis" && tier !== "berbayar") {
    notFound();
  }

  const payload = await getSimulationPayload(tier as AccessTier, slug);

  if (!payload) {
    notFound();
  }

  const access = await getTryoutAccessStatus(await getServerSession(), tier as AccessTier, slug);

  if (!access.allowed) {
    return (
      <section className="guard-panel stack-md">
        <span className="eyebrow">Akses Belum Aktif</span>
        <h1>Tryout ini belum bisa dimulai</h1>
        <p>{access.reason}</p>
        <div className="hero-actions">
          <DepthButton href={`/tryout/${tier}/${slug}`} tone="cyan">
            Kembali ke detail tryout
          </DepthButton>
          <DepthButton href="/subscription" tone="ghost">
            Lihat subscription
          </DepthButton>
        </div>
      </section>
    );
  }

  return (
    <SimulationRunner
      slug={slug}
      title={payload.title}
      tier={tier as AccessTier}
      category={payload.entry.category}
      mode={payload.entry.mode}
      focus={payload.focus}
      durationValue={payload.durationValue}
      adaptiveNote={payload.adaptiveNote}
      questions={payload.questions}
    />
  );
}
