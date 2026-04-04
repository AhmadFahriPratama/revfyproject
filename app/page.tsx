import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { freeTryouts, formatNumber, homeDestinations, materialTracks, platformSnapshot, premiumTryouts } from "@/lib/catalog";

export default function HomePage() {
  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Revfy"
        title="Platform belajar yang terasa hidup, taktis, dan tetap ringan"
        description="Revfy membantu pengguna belajar lebih terarah lewat materi, tryout, dan dashboard yang mudah dipakai di desktop maupun mobile."
        badges={materialTracks.slice(0, 4).map((track) => track.category)}
        actions={[
          { label: "Masuk sekarang", href: "/login" },
          { label: "Lihat tryout berbayar", href: "/tryout/berbayar", tone: "cyan" },
        ]}
        note="Mulai dari materi dasar, lanjut ke tryout, lalu pantau progres dari dashboard dalam satu alur yang sederhana."
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
          <h2>Pilih jalur belajar sesuai kebutuhan</h2>
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
          <h2>Materi disusun agar lebih mudah dipilih dan dipelajari</h2>
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
            <span className="eyebrow">Tryout Gratis</span>
            <h2>Mulai dari tryout gratis untuk latihan singkat dan cepat</h2>
          </div>
          <div className="stack-sm">
            {freeTryouts.slice(0, 3).map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.focus}</p>
                </div>
                <span>{item.duration}</span>
              </div>
            ))}
          </div>
          <DepthButton href="/tryout/gratis" tone="ghost">
            Jelajahi tryout gratis
          </DepthButton>
        </article>

        <article className="glass-panel lane-column lane-column--accent">
          <div className="section-heading">
            <span className="eyebrow">Tryout Berbayar</span>
            <h2>Naik ke simulasi besar saat butuh volume dan intensitas</h2>
          </div>
          <div className="stack-sm">
            {premiumTryouts.slice(0, 3).map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.mode}</p>
                </div>
                <span>{item.itemCount} soal</span>
              </div>
            ))}
          </div>
          <DepthButton href="/subscription" tone="cyan">
            Buka subscription
          </DepthButton>
        </article>
      </section>

      <section className="glass-panel banner-strip banner-strip--spotlight">
        <div>
          <span className="eyebrow">Lanjut Belajar</span>
          <h2>Masuk untuk membuka dashboard, bookmark, dan progres belajar</h2>
          <p>Setelah login, Anda bisa menyimpan halaman favorit, melihat riwayat latihan, dan melanjutkan belajar dengan lebih mudah.</p>
        </div>
        <DepthButton href="/login" tone="cyan">
          Masuk sekarang
        </DepthButton>
      </section>
    </div>
  );
}
