import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { formatNumber, getDailyTryoutRotation, homeDestinations, materialTracks, platformSnapshot } from "@/lib/catalog";

export const revalidate = 300;

export default function HomePage() {
  const rotation = getDailyTryoutRotation();

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Revfy"
        title="Belajar lebih rapi, ringan, dan nyaman di semua perangkat"
        description="Revfy merangkum materi, tryout, dan dashboard dalam alur yang lebih sederhana agar tetap enak dipakai di desktop maupun mobile."
        badges={materialTracks.slice(0, 3).map((track) => track.category)}
        actions={[
          { label: "Masuk sekarang", href: "/login" },
          { label: "Lihat tryout", href: "/tryout", tone: "cyan" },
        ]}
        note="Mulai dari materi, lanjut ke tryout, lalu cek progres di dashboard tanpa pindah alur yang membingungkan."
        stats={[
          { label: "Set aktif", value: formatNumber(platformSnapshot.totalTryouts) },
          { label: "Total item", value: formatNumber(platformSnapshot.totalQuestions) },
          { label: "Kategori", value: formatNumber(platformSnapshot.totalCategories) },
        ]}
      >
        <HeroModel variant="brand" label="Pusat navigasi belajar" />
      </PageIntro>

      <section className="stack-md">
        <div className="section-heading">
          <span className="eyebrow">Menu Utama</span>
          <h2>Pilih jalur belajar yang paling relevan</h2>
        </div>
        <div className="content-grid content-grid--three">
          {homeDestinations.map((item) => (
            <article key={item.href} className="glass-panel card-surface card-surface--interactive">
              <span className="card-tag">{item.badge}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <DepthButton href={item.href} tone="ghost" size="sm">
                Buka halaman
              </DepthButton>
            </article>
          ))}
        </div>
      </section>

      <section className="stack-md">
        <div className="section-heading">
          <span className="eyebrow">Kategori Materi</span>
          <h2>Materi disusun agar cepat dipilih dan langsung dipelajari</h2>
        </div>
        <div className="content-grid content-grid--three">
          {materialTracks.slice(0, 6).map((track) => (
            <article key={track.category} className="glass-panel card-surface card-surface--interactive">
              <span className="card-tag">{track.category}</span>
              <h3>{track.title}</h3>
              <p>{track.description}</p>
              <div className="meta-row">
                <span>{track.moduleCount} modul</span>
                <span>{track.questionCount} item</span>
              </div>
              <p className="sub-copy">Mode dominan: {track.modes}</p>
              <DepthButton href={track.href} tone="ghost" size="sm">
                Buka materi
              </DepthButton>
            </article>
          ))}
        </div>
      </section>

      <section className="dual-lane">
        <article className="glass-panel lane-column">
          <div className="section-heading">
            <span className="eyebrow">Gratis Hari Ini</span>
            <h2>Ada satu tryout gratis aktif untuk pemanasan harian</h2>
          </div>
          <div className="stack-sm">
            {rotation.free.map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.focus}</p>
                </div>
                <span>{item.duration}</span>
              </div>
            ))}
          </div>
          <p className="sub-copy">Lineup tryout berganti lagi {rotation.nextRefreshLabel}.</p>
          <DepthButton href="/tryout/gratis" tone="ghost">
            Buka tryout gratis hari ini
          </DepthButton>
        </article>

        <article className="glass-panel lane-column lane-column--accent">
          <div className="section-heading">
            <span className="eyebrow">Premium Hari Ini</span>
            <h2>Pilih tryout premium aktif saat butuh intensitas lebih tinggi</h2>
          </div>
          <div className="stack-sm">
            {rotation.premium.slice(0, 3).map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.mode}</p>
                </div>
                <span>{item.itemCount} soal</span>
              </div>
            ))}
          </div>
          <p className="sub-copy">Hari ini tersedia {formatNumber(rotation.total)} tryout aktif dengan komposisi fokus harian.</p>
          <DepthButton href="/tryout" tone="cyan">
            Buka lineup tryout
          </DepthButton>
        </article>
      </section>

      <section className="glass-panel banner-strip banner-strip--spotlight">
        <div>
          <span className="eyebrow">Lanjut Belajar</span>
          <h2>Masuk untuk membuka dashboard, bookmark, dan progres belajar</h2>
          <p>Setelah login, Anda bisa menyimpan halaman penting, melihat riwayat latihan, dan melanjutkan belajar dengan lebih cepat.</p>
        </div>
        <DepthButton href="/login" tone="cyan">
          Masuk sekarang
        </DepthButton>
      </section>
    </div>
  );
}
