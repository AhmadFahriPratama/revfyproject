import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { TryoutBrowser } from "@/components/tryout-browser";
import { TryoutRotationCountdown } from "@/components/tryout-rotation-countdown";
import { formatNumber, getDailyTryoutRotation } from "@/lib/catalog";

export const revalidate = 300;

const perks = [
  "Masuk tanpa subscription untuk eksplorasi awal.",
  "Cocok untuk pemanasan harian dan validasi ritme belajar.",
  "Mudah dicoba sebelum masuk ke sesi yang lebih panjang.",
];

export default function TryoutGratisPage() {
  const rotation = getDailyTryoutRotation();

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Tryout Gratis"
        title="Satu tryout gratis aktif setiap hari untuk mulai cepat"
        description="Halaman ini hanya menampilkan tryout gratis yang sedang aktif pada lineup harian, sehingga pilihan tetap ringan dan mudah dibuka dari mobile."
        badges={["Gratis", "Rotasi harian", "Mulai cepat"]}
        actions={[{ label: "Login untuk simpan progress", href: "/login" }]}
        note="Set gratis akan berganti saat cooldown selesai, lalu tryout gratis sebelumnya masuk ke antrian rotasi hari berikutnya."
        stats={[
          { label: "Set gratis", value: formatNumber(rotation.freeCount) },
          { label: "Lineup harian", value: formatNumber(rotation.total) },
          { label: "Akses", value: "Open" },
        ]}
      >
        <HeroModel variant="core" label="Tryout gratis" />
      </PageIntro>

      <section className="glass-panel banner-strip banner-strip--spotlight">
        <div>
          <span className="eyebrow">Cooldown</span>
          <h2>Tryout gratis berikutnya muncul saat reset harian</h2>
          <p>Gunakan tryout gratis aktif hari ini sebagai pintu masuk sebelum naik ke tryout premium yang tersedia di lineup yang sama.</p>
        </div>
        <TryoutRotationCountdown nextRefreshAt={rotation.nextRefreshAt} />
      </section>

      <TryoutBrowser items={rotation.free} eyebrow="Daftar Tryout" title="Tryout gratis yang aktif hari ini" sourceLabel="Cocok untuk pemanasan, latihan singkat, dan mulai belajar tanpa biaya." />

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Kenapa gratis</span>
          <h2>Supaya onboarding tetap cepat tanpa bikin pilihan terlalu ramai</h2>
          <p>{perks.join(" ")}</p>
        </div>
        <DepthButton href="/tryout" tone="cyan">
          Buka lineup tryout
        </DepthButton>
      </section>
    </div>
  );
}
