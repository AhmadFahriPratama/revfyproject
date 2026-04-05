import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { TryoutBrowser } from "@/components/tryout-browser";
import { TryoutRotationCountdown } from "@/components/tryout-rotation-countdown";
import { formatNumber, getDailyTryoutRotation, subscriptionPlans } from "@/lib/catalog";

export const revalidate = 300;

export default function TryoutBerbayarPage() {
  const rotation = getDailyTryoutRotation();

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Tryout Berbayar"
        title="Tryout premium aktif untuk sesi yang lebih panjang dan intens"
        description="Halaman ini hanya menampilkan tryout berbayar yang sedang aktif pada rotasi harian, jadi pengguna langsung melihat paket premium yang benar-benar bisa dibuka hari ini."
        badges={["Berbayar", "Rotasi harian", "Sesi panjang"]}
        actions={[
          { label: "Lihat subscription", href: "/subscription" },
          { label: "Buka semua lineup", href: "/tryout", tone: "ghost" },
        ]}
        note="Tryout premium di luar lineup hari ini ditahan sampai cooldown selesai dan lineup berikutnya dibuka."
        stats={[
          { label: "Set berbayar", value: formatNumber(rotation.premiumCount) },
          { label: "Paket", value: subscriptionPlans.length.toString() },
          { label: "Akses", value: "Subscription" },
        ]}
      >
        <HeroModel variant="premium" label="Tryout berbayar" />
      </PageIntro>

      <section className="glass-panel banner-strip banner-strip--spotlight">
        <div>
          <span className="eyebrow">Cooldown</span>
          <h2>Lineup premium berganti saat reset harian</h2>
          <p>Gunakan countdown ini untuk mengetahui kapan daftar tryout premium aktif akan diacak ulang.</p>
        </div>
        <TryoutRotationCountdown nextRefreshAt={rotation.nextRefreshAt} />
      </section>

      <TryoutBrowser items={rotation.premium} eyebrow="Daftar Tryout" title="Tryout premium yang aktif hari ini" sourceLabel="Cocok untuk sesi latihan yang lebih serius dan terarah." />

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Paket Belajar</span>
          <h2>Tryout premium aktif tetap terhubung ke pilihan paket</h2>
          <p>Pilih paket yang sesuai agar tryout premium yang sedang aktif hari ini bisa langsung dibuka tanpa menunggu lagi.</p>
        </div>
        <DepthButton href="/subscription" tone="cyan">
          Pilih paket sekarang
        </DepthButton>
      </section>
    </div>
  );
}
