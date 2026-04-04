import { notFound } from "next/navigation";

import { SimulationRunner } from "@/components/simulation-runner";
import type { AccessTier } from "@/lib/catalog";
import { getSimulationPayload } from "@/lib/dataset";

export default async function SimulationPage({ params }: { params: Promise<{ tier: string; slug: string }> }) {
  const { tier, slug } = await params;

  if (tier !== "gratis" && tier !== "berbayar") {
    notFound();
  }

  const payload = await getSimulationPayload(tier as AccessTier, slug);

  if (!payload) {
    notFound();
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
