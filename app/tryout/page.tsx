import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { TryoutBrowser } from "@/components/tryout-browser";
import { TryoutRotationCountdown } from "@/components/tryout-rotation-countdown";
import { formatNumber, getDailyTryoutRotation } from "@/lib/catalog";
import { dailyTryoutTokenChannelUrl } from "@/lib/marketing";

export const revalidate = 300;

export default function TryoutPage() {
  const rotation = getDailyTryoutRotation();

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Tryout Harian"
        title="Lineup tryout dibuat fokus dan berganti setiap hari"
        description="Revfy menampilkan 5-7 tryout aktif per hari agar pilihan tetap ringkas di mobile, dengan pola 1 tryout gratis dan sisanya tryout berbayar."
        badges={["Rotasi harian", "1 gratis", `${rotation.premiumCount} berbayar`]}
        actions={[
          { label: "Buka tryout gratis", href: "/tryout/gratis" },
          { label: "Lihat paket", href: "/subscription", tone: "cyan" },
        ]}
        note="Saat cooldown selesai, lineup berganti otomatis dan tryout di luar lineup hari ini tidak lagi tersedia sampai rotasi berikutnya."
        stats={[
          { label: "Aktif hari ini", value: formatNumber(rotation.total) },
          { label: "Gratis", value: formatNumber(rotation.freeCount) },
          { label: "Berbayar", value: formatNumber(rotation.premiumCount) },
        ]}
      >
        <HeroModel variant="premium" label="Lineup tryout harian" />
      </PageIntro>

      <section className="glass-panel banner-strip banner-strip--spotlight">
        <div>
          <span className="eyebrow">Cooldown</span>
          <h2>Lineup berikutnya siap setelah reset harian</h2>
          <p>Rotasi hari ini memakai kunci {rotation.key} dan akan diperbarui otomatis pada 00.00 WIB.</p>
        </div>
        <TryoutRotationCountdown nextRefreshAt={rotation.nextRefreshAt} />
      </section>

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Token Gratis Harian</span>
          <h2>Kode referral dan token gratis harian dibagikan lewat WhatsApp channel</h2>
          <p>Silakan pantau channel ini jika Anda ingin membagikan token gratis harian untuk membuka start tryout premium.</p>
          <a href={dailyTryoutTokenChannelUrl} target="_blank" rel="noreferrer" className="inline-link">
            {dailyTryoutTokenChannelUrl}
          </a>
        </div>
        <DepthButton href={dailyTryoutTokenChannelUrl} tone="ghost">
          Buka WhatsApp channel
        </DepthButton>
      </section>

      <TryoutBrowser
        items={rotation.all}
        eyebrow="Lineup Hari Ini"
        title="Pilih tryout yang masih aktif sekarang"
        sourceLabel="Filter akses, mode, atau kata kunci untuk membuka tryout yang sedang tersedia pada rotasi hari ini."
      />

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Akses Premium</span>
          <h2>Butuh tryout yang lebih panjang dan intens?</h2>
          <p>Naik ke paket belajar supaya tryout premium yang sedang aktif hari ini bisa langsung dikerjakan tanpa friksi.</p>
        </div>
        <DepthButton href="/subscription" tone="ghost">
          Buka subscription
        </DepthButton>
      </section>
    </div>
  );
}
