import { BookmarkToggle } from "@/components/bookmark-toggle";
import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { adminTopDatasets, authenticSamples, formatNumber } from "@/lib/catalog";

export default function SoalAsliPage() {
  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Soal Asli"
        title="Contoh soal untuk melihat pola yang lebih realistis"
        description="Halaman ini menampilkan contoh soal, tingkat kesulitan, topik, dan pembahasan agar pengguna mendapat gambaran latihan yang lebih nyata."
        badges={["Contoh soal", "Pembahasan", "Topik nyata"]}
        note="Gunakan halaman ini untuk melihat gaya soal dan pembahasan sebelum masuk ke tryout yang lebih lengkap."
        stats={[
          { label: "Contoh soal", value: formatNumber(authenticSamples.length) },
          { label: "Set terbesar", value: adminTopDatasets[0]?.items ?? "0" },
          { label: "Kategori dominan", value: adminTopDatasets[0]?.category ?? "-" },
        ]}
      >
        <HeroModel variant="premium" label="Contoh soal" />
      </PageIntro>

      <section className="content-grid content-grid--two">
        {authenticSamples.map((sample) => (
          <article key={sample.id} className="glass-panel card-surface card-surface--interactive">
            <div className="card-surface__head">
              <div className="meta-row meta-row--tight">
                <span>{sample.subject}</span>
                <span>{sample.level}</span>
                <span>{sample.difficulty}</span>
              </div>
              <BookmarkToggle item={{ key: `authentic:${sample.id}`, label: sample.title, href: "/soal-asli" }} />
            </div>
            <h3>{sample.question}</h3>
            <p className="sub-copy">Topik: {sample.topic}</p>
            <div className="answer-box">
              <strong>Jawaban: {sample.answer}</strong>
              <p>{sample.tip}</p>
              <p>{sample.explanation}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="glass-panel banner-strip">
        <div>
          <span className="eyebrow">Ringkasan</span>
          <h2>Bank soal besar siap dipakai untuk latihan</h2>
          <p>Daftar ini memberi gambaran kategori dan jumlah soal yang tersedia untuk latihan berikutnya.</p>
        </div>
        <div className="stack-sm">
          {adminTopDatasets.slice(0, 3).map((dataset) => (
            <div key={dataset.path} className="list-row">
              <strong>{dataset.title}</strong>
              <span>{dataset.items} item</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
