import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { TryoutBrowser } from "@/components/tryout-browser";
import { formatNumber, premiumTryouts, subscriptionPlans } from "@/lib/catalog";

export default function TryoutBerbayarPage() {
  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Tryout Berbayar"
        title="Simulasi penuh untuk pengguna yang butuh volume dan intensitas"
        description="Tryout berbayar dirancang untuk sesi yang lebih panjang, jumlah soal yang lebih besar, dan persiapan yang lebih intensif."
        badges={["Berbayar", "Sesi panjang", "Soal lebih banyak"]}
        actions={[
          { label: "Lihat subscription", href: "/subscription" },
          { label: "Masuk ke dashboard", href: "/dashboard", tone: "ghost" },
        ]}
        note="Halaman ini membantu Anda memilih tryout dengan jumlah soal dan durasi yang sesuai dengan target latihan."
        stats={[
          { label: "Set berbayar", value: formatNumber(premiumTryouts.length) },
          { label: "Paket", value: subscriptionPlans.length.toString() },
          { label: "Akses", value: "Subscription" },
        ]}
      >
        <HeroModel variant="premium" label="Tryout berbayar" />
      </PageIntro>

      <TryoutBrowser items={premiumTryouts} eyebrow="Daftar Tryout" title="Pilih tryout yang sesuai dengan target Anda" sourceLabel="Cocok untuk sesi latihan yang lebih serius dan terarah." />

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Paket Belajar</span>
          <h2>Tryout berbayar terhubung ke pilihan paket</h2>
          <p>Pilih paket yang sesuai agar Anda bisa membuka tryout yang lebih lengkap dan intensif.</p>
        </div>
        <DepthButton href="/subscription" tone="cyan">
          Pilih paket sekarang
        </DepthButton>
      </section>
    </div>
  );
}
