import { BookmarkToggle } from "@/components/bookmark-toggle";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { formatNumber, practiceSamples, platformSnapshot } from "@/lib/catalog";

export default function LatihanSoalPage() {
  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Latihan Soal"
        title="Drill cepat dengan pembahasan yang langsung terlihat"
        description="Halaman ini menampilkan contoh latihan soal dengan jawaban dan pembahasan yang langsung terlihat agar proses belajar terasa lebih cepat."
        badges={["Quick drill", "Answer reveal", "Preview ready"]}
        note="Gunakan halaman ini untuk latihan singkat sebelum masuk ke set yang lebih panjang."
        stats={[
          { label: "Sample card", value: formatNumber(practiceSamples.length) },
          { label: "Kategori aktif", value: formatNumber(platformSnapshot.totalCategories) },
          { label: "Total bank", value: formatNumber(platformSnapshot.totalQuestions) },
        ]}
      >
        <HeroModel variant="focus" label="Latihan soal" />
      </PageIntro>

      <section className="content-grid content-grid--two">
        {practiceSamples.map((sample) => (
          <article key={sample.id} className="glass-panel card-surface card-surface--interactive">
            <div className="card-surface__head">
              <span className="card-tag">{sample.title}</span>
              <BookmarkToggle item={{ key: `practice:${sample.id}`, label: sample.title, href: "/latihan-soal" }} />
            </div>
            <h3>{sample.question}</h3>
            <div className="option-list">
              {sample.options.map(([key, value]) => (
                <div key={key} className="option-row">
                  <strong>{key}</strong>
                  <span>{value}</span>
                </div>
              ))}
            </div>
            <div className="answer-box">
              <strong>Jawaban: {sample.answer}</strong>
              <p>{sample.explanation}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
