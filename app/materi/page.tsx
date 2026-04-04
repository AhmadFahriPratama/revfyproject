import { HeroModel } from "@/components/hero-model";
import { MaterialBrowser } from "@/components/material-browser";
import { PageIntro } from "@/components/page-intro";
import { formatNumber, materialTracks, platformSnapshot } from "@/lib/catalog";

const studyModes = [
  {
    title: "Belajar Bertahap",
    description: "Mulai dari gambaran besar, lalu lanjut ke subtopik dan jenis soal yang paling sering muncul.",
  },
  {
    title: "Materi Lebih Terukur",
    description: "Setiap kategori menampilkan jumlah modul dan soal agar Anda lebih mudah memilih prioritas.",
  },
  {
    title: "Lebih Mudah Dipindai",
    description: "Susunan halaman dibuat ringkas agar pencarian materi terasa lebih cepat dan nyaman.",
  },
];

export default function MateriPage() {
  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Materi"
        title="Peta belajar yang lebih rapi dan mudah dipilih"
        description="Halaman materi menampilkan kategori belajar beserta jumlah modul, bank soal, dan mode yang paling sering digunakan agar Anda cepat menentukan titik mulai."
        badges={["Kategori belajar", "Bookmark", "Progres"]}
        note="Gunakan pencarian, filter, dan bookmark untuk membuka materi yang paling relevan dengan kebutuhan Anda."
        stats={[
          { label: "Kategori", value: formatNumber(platformSnapshot.totalCategories) },
          { label: "Bank item", value: formatNumber(platformSnapshot.totalQuestions) },
          { label: "Set", value: formatNumber(platformSnapshot.totalTryouts) },
        ]}
      >
        <HeroModel variant="matrix" label="Peta materi" />
      </PageIntro>

      <MaterialBrowser tracks={materialTracks} />

      <section className="content-grid content-grid--three">
        {studyModes.map((mode) => (
          <article key={mode.title} className="glass-panel stat-surface">
              <span className="card-tag">Panduan</span>
            <h3>{mode.title}</h3>
            <p>{mode.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
