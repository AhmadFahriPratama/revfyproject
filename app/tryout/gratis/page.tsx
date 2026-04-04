import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { TryoutBrowser } from "@/components/tryout-browser";
import { formatNumber, freeTryouts } from "@/lib/catalog";

const perks = [
  "Masuk tanpa subscription untuk eksplorasi awal.",
  "Cocok untuk pemanasan harian dan validasi ritme belajar.",
  "Mudah dicoba sebelum masuk ke sesi yang lebih panjang.",
];

export default function TryoutGratisPage() {
  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Tryout Gratis"
        title="Pintu masuk paling ringan untuk mulai belajar"
        description="Tryout gratis berisi mini drill, section test, dan final sprint agar pengguna bisa langsung mulai latihan tanpa hambatan awal."
        badges={["Gratis", "Mini drill", "Mulai cepat"]}
        actions={[{ label: "Login untuk simpan progress", href: "/login" }]}
        note="Gunakan filter untuk memilih tryout yang paling cocok dengan waktu dan target belajar Anda."
        stats={[
          { label: "Set gratis", value: formatNumber(freeTryouts.length) },
          { label: "Format", value: "Sprint / Drill" },
          { label: "Akses", value: "Open" },
        ]}
      >
        <HeroModel variant="core" label="Tryout gratis" />
      </PageIntro>

      <TryoutBrowser items={freeTryouts} eyebrow="Daftar Tryout" title="Pilih tryout gratis dengan lebih cepat" sourceLabel="Cocok untuk pemanasan, latihan singkat, dan mulai belajar tanpa biaya." />

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Kenapa gratis</span>
          <h2>Supaya onboarding terasa cepat dan meyakinkan</h2>
          <p>{perks.join(" ")}</p>
        </div>
        <DepthButton href="/tryout/berbayar" tone="cyan">
          Lihat tryout berbayar
        </DepthButton>
      </section>
    </div>
  );
}
