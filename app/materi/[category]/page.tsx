import { notFound } from "next/navigation";

import { BookmarkToggle } from "@/components/bookmark-toggle";
import { DepthButton } from "@/components/depth-button";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { getMaterialCategoryDetail, getMaterialCategorySlugs } from "@/lib/dataset";

export function generateStaticParams() {
  return getMaterialCategorySlugs().map((category) => ({ category }));
}

export default async function MaterialCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const detail = getMaterialCategoryDetail(category);

  if (!detail) {
    notFound();
  }

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Materi Detail"
        title={`${detail.track.category} untuk belajar lebih terarah`}
        description="Halaman ini merangkum jumlah set, pembagian tryout gratis dan berbayar, serta daftar set utama agar Anda lebih mudah menentukan pilihan belajar."
        badges={[detail.track.category, `${detail.track.moduleCount} set`, `${detail.track.questionCount} item`]}
        actions={[
          { label: "Kembali ke materi", href: "/materi", tone: "ghost" },
          { label: "Lihat tryout berbayar", href: "/tryout/berbayar", tone: "cyan" },
        ]}
        note="Halaman ini cocok dipakai untuk membandingkan kategori, melihat jumlah set, dan menentukan langkah belajar berikutnya."
        stats={[
          { label: "Jumlah set", value: detail.track.moduleCount },
          { label: "Bank soal", value: detail.track.questionCount },
          { label: "Jenis mode", value: detail.modeSummary.length.toString() },
        ]}
      >
        <HeroModel variant="matrix" label={`${detail.track.category} detail materi`} />
      </PageIntro>

      <section className="glass-panel banner-strip banner-strip--compact">
        <div>
          <span className="eyebrow">Bookmark</span>
          <h2>Simpan kategori ini</h2>
          <p>Bookmark membantu Anda membuka kembali kategori yang sering dipelajari tanpa perlu mencari dari awal.</p>
        </div>
        <BookmarkToggle item={{ key: `lane:${detail.track.href}`, label: detail.track.title, href: detail.track.href }} />
      </section>

      <section className="content-grid content-grid--two">
        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Pembagian Mode</span>
            <h2>Distribusi format belajar di kategori ini</h2>
          </div>
          <div className="stack-sm">
            {detail.modeSummary.map((mode) => (
              <div key={mode.mode} className="list-row">
                <strong>{mode.mode}</strong>
                <span>{mode.total} file</span>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Pembagian Akses</span>
            <h2>Komposisi jalur gratis dan berbayar</h2>
          </div>
          <div className="stack-sm">
            {detail.tierSummary.map((item) => (
              <div key={item.tier} className="list-row">
                <strong>{item.tier === "gratis" ? "Tryout Gratis" : "Tryout Berbayar"}</strong>
                <span>{item.total} set</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="stack-md">
        <div className="section-heading">
          <span className="eyebrow">Set Utama</span>
          <h2>Set terbesar untuk kategori {detail.track.category}</h2>
        </div>
        <div className="content-grid content-grid--three">
          {detail.relatedSets.slice(0, 9).map((entry) => (
            <article key={`${entry.id}-${entry.path}`} className="glass-panel card-surface">
              <span className="card-tag">{entry.accessTier === "gratis" ? "Gratis" : "Berbayar"}</span>
              <h3>{entry.title}</h3>
              <p>{entry.focus}</p>
              <div className="meta-row">
                <span>{entry.mode}</span>
                <span>{entry.itemCount} soal</span>
                <span>{entry.duration}</span>
              </div>
              <DepthButton href={entry.href} tone="ghost" size="sm">
                Buka detail set
              </DepthButton>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
