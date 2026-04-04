import matrixIndex from "@/data/tryout_matrix_index.json";
import tryoutIndex from "@/data/tryout_index.json";
import utbkFinalSprint from "@/data/tryout/UTBK/utbk_final_sprint_v01.json";
import informatikaAuthentic from "@/data/tryout/SMK_SMA/TKA_TRYOUT_SMK_SMA_Informatika.json";

type MatrixEntry = {
  path: string;
  category: string;
  file: string;
  id: string | null;
  title: string | null;
  mode: string;
  focus: string | null;
  itemCount: number;
  duration: number | null;
};

type IndexEntry = {
  path: string;
  file: string;
  category: string;
  id: string | null;
  title: string | null;
  itemCount: number;
};

type SprintQuestion = {
  id: string;
  pertanyaan: string;
  opsi: Record<string, string>;
  jawaban: string;
  pembahasan: string;
};

type SprintSet = {
  id: string;
  judul: string;
  mode: string;
  focus: string;
  durasiMenit: number;
  soal: SprintQuestion[];
};

type AuthenticQuestion = {
  id: string;
  mapel: string;
  jenjang: string;
  topik: string;
  pertanyaan: string;
  jawaban: string;
  pembahasan: string;
  trik: string;
  tingkat: string;
  opsi: Record<string, string>;
};

export type AccessTier = "gratis" | "berbayar";

export type TryoutCard = {
  id: string;
  slug: string;
  href: string;
  accessTier: AccessTier;
  title: string;
  category: string;
  focus: string;
  mode: string;
  itemCount: string;
  itemCountValue: number;
  duration: string;
  durationValue: number;
  path: string;
};

export type MaterialTrack = {
  category: string;
  slug: string;
  href: string;
  title: string;
  description: string;
  moduleCount: string;
  moduleCountValue: number;
  questionCount: string;
  questionCountValue: number;
  modes: string;
};

const matrixEntries = matrixIndex.entries as MatrixEntry[];
const tryoutEntries = tryoutIndex.entries as IndexEntry[];
const sprintSet = utbkFinalSprint as SprintSet;
const authenticQuestions = informatikaAuthentic as AuthenticQuestion[];

const categoryCopy: Record<string, string> = {
  CPNS: "Lintasan numerik dan verbal dengan simulasi padat.",
  SMP: "Persiapan soal asli dan adaptasi TKA tingkat SMP.",
  SMK_SMA: "Bank besar lintas mapel untuk fase akhir sekolah.",
  TKA_SMK: "Kumpulan simulasi wajib dan pilihan untuk SMK.",
  TKA_SMP: "Drill kurikulum dan evaluasi TKA tingkat SMP.",
  UTBK: "Sprint bernalar, literasi, dan simulasi nasional.",
};

function formatTitle(raw: string | null | undefined) {
  const base = raw ?? "Untitled Set";
  return base
    .replace(/\.json$/i, "")
    .replace(/[\-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMode(mode: string) {
  return mode
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function pickDurationValue(entry: MatrixEntry) {
  if (entry.duration) {
    return entry.duration;
  }

  return Math.max(30, Math.round(entry.itemCount * 1.1));
}

function pickDuration(entry: MatrixEntry) {
  return `${pickDurationValue(entry)} menit`;
}

function pickAccessTier(entry: MatrixEntry): AccessTier {
  return freeMode.has(entry.mode) || entry.itemCount <= 50 ? "gratis" : "berbayar";
}

function toTryoutCard(entry: MatrixEntry): TryoutCard {
  const accessTier = pickAccessTier(entry);
  const slug = slugifySegment(entry.id ?? entry.title ?? entry.file);

  return {
    id: entry.id ?? entry.file,
    slug,
    href: `/tryout/${accessTier}/${slug}`,
    accessTier,
    title: formatTitle(entry.title ?? entry.id ?? entry.file),
    category: entry.category,
    focus: entry.focus ?? "Multi topik adaptif",
    mode: formatMode(entry.mode),
    itemCount: formatNumber(entry.itemCount),
    itemCountValue: entry.itemCount,
    duration: pickDuration(entry),
    durationValue: pickDurationValue(entry),
    path: entry.path,
  };
}

const groupedByCategory = new Map<string, MatrixEntry[]>();

for (const entry of matrixEntries) {
  const bucket = groupedByCategory.get(entry.category) ?? [];
  bucket.push(entry);
  groupedByCategory.set(entry.category, bucket);
}

const freeMode = new Set(["mini_drill", "section_test", "final_sprint"]);

export const platformSnapshot = {
  totalTryouts: matrixEntries.length,
  totalQuestions: tryoutEntries.reduce((total, entry) => total + entry.itemCount, 0),
  totalCategories: groupedByCategory.size,
  averageDuration:
    Math.round(
      matrixEntries.reduce((total, entry) => total + (entry.duration ?? 0), 0) /
        matrixEntries.filter((entry) => entry.duration !== null).length,
    ) || 0,
};

export const homeDestinations = [
  {
    href: "/materi",
    title: "Materi",
    description: "Pilih kategori belajar sesuai kebutuhan dan target Anda.",
    badge: "Kategori",
  },
  {
    href: "/latihan-soal",
    title: "Latihan Soal",
    description: "Preview drill cepat lengkap dengan jawaban dan pembahasan singkat.",
    badge: "Latihan",
  },
  {
    href: "/soal-asli",
    title: "Soal Asli",
    description: "Lihat contoh soal dan pembahasan untuk gambaran yang lebih nyata.",
    badge: "Contoh",
  },
  {
    href: "/tryout/gratis",
    title: "Tryout Gratis",
    description: "Masuk cepat ke mini drill, section test, dan final sprint tanpa biaya.",
    badge: "Gratis",
  },
  {
    href: "/tryout/berbayar",
    title: "Tryout Berbayar",
    description: "Paket besar untuk simulasi panjang, bank soal penuh, dan mode intensif.",
    badge: "Berbayar",
  },
  {
    href: "/subscription",
    title: "Subscription",
    description: "Bandingkan paket belajar dan pilih yang paling sesuai.",
    badge: "Paket",
  },
];

export const materialTracks: MaterialTrack[] = Array.from(groupedByCategory.entries())
  .map(([category, entries]) => {
    const totalItems = entries.reduce((sum, entry) => sum + entry.itemCount, 0);
    const dominantModes = Array.from(new Set(entries.slice(0, 3).map((entry) => formatMode(entry.mode))));

    return {
      category,
      slug: slugifySegment(category),
      href: `/materi/${slugifySegment(category)}`,
      title: `${category} Belajar`,
      description: categoryCopy[category] ?? "Belajar lebih terarah dengan materi dan bank soal yang tersusun rapi.",
      moduleCount: formatNumber(entries.length),
      moduleCountValue: entries.length,
      questionCount: formatNumber(totalItems),
      questionCountValue: totalItems,
      modes: dominantModes.join(" / "),
    };
  })
  .sort((left, right) => right.questionCountValue - left.questionCountValue);

export const allTryoutCatalog = matrixEntries.map(toTryoutCard);

export const freeTryouts = allTryoutCatalog
  .filter((entry) => entry.accessTier === "gratis")
  .slice(0, 6)
  .map((entry) => entry);

export const premiumTryouts = allTryoutCatalog
  .filter((entry) => entry.accessTier === "berbayar" && entry.itemCountValue >= 90)
  .slice(0, 6)
  .map((entry) => entry);

export const practiceSamples = sprintSet.soal.slice(0, 4).map((question, index) => ({
  id: question.id,
  title: `Drill ${index + 1}`,
  question: question.pertanyaan,
  answer: question.jawaban,
  explanation: question.pembahasan,
  options: Object.entries(question.opsi).slice(0, 5),
}));

export const authenticSamples = authenticQuestions.slice(0, 4).map((question, index) => ({
  id: question.id,
  title: `Contoh ${index + 1}`,
  subject: question.mapel,
  level: question.jenjang,
  topic: question.topik,
  difficulty: question.tingkat,
  question: question.pertanyaan,
  answer: question.jawaban,
  tip: question.trik,
  explanation: question.pembahasan,
}));

export const subscriptionPlans = [
  {
    name: "Free",
    price: "Rp0",
    accent: "Starter",
    description: "Cocok untuk mulai belajar dan mencoba tryout gratis.",
    features: [
      "Akses halaman publik penuh",
      "Dashboard dasar",
      "Mini drill dan sprint gratis",
      "Preview soal asli dan pembahasan",
    ],
  },
  {
    name: "Pro",
    price: "Rp79.000",
    accent: "Populer",
    description: "Paket ideal untuk latihan rutin dan tryout yang lebih lengkap.",
    features: [
      "Semua tryout gratis",
      "Akses tryout berbayar terpilih",
      "Ringkasan progres mingguan",
      "Rekomendasi fokus kategori",
    ],
  },
  {
    name: "Elite",
    price: "Rp149.000",
    accent: "Lengkap",
    description: "Akses paling lengkap untuk latihan intensif dan bank soal yang lebih besar.",
    features: [
      "Semua tryout berbayar",
      "Dashboard lebih lengkap",
      "Bank soal besar lintas kategori",
      "Akses fitur tambahan lebih awal",
    ],
  },
];

export const adminTopDatasets = [...tryoutEntries]
  .sort((left, right) => right.itemCount - left.itemCount)
  .slice(0, 6)
  .map((entry) => ({
    title: formatTitle(entry.title ?? entry.id ?? entry.file),
    category: entry.category,
    items: formatNumber(entry.itemCount),
    path: entry.path,
  }));

export const adminModeDistribution = Array.from(
  matrixEntries.reduce((accumulator, entry) => {
    const current = accumulator.get(entry.mode) ?? 0;
    accumulator.set(entry.mode, current + 1);
    return accumulator;
  }, new Map<string, number>()),
)
  .map(([mode, total]) => ({
    mode: formatMode(mode),
    total: formatNumber(total),
  }))
  .sort((left, right) => Number(right.total.replace(/\./g, "")) - Number(left.total.replace(/\./g, "")));

export const dashboardRecommendations = [...premiumTryouts.slice(0, 3), ...freeTryouts.slice(0, 2)];

export const adminExplorerItems = allTryoutCatalog.map((entry) => ({
  id: entry.id,
  title: entry.title,
  category: entry.category,
  mode: entry.mode,
  accessTier: entry.accessTier,
  itemCount: entry.itemCount,
  itemCountValue: entry.itemCountValue,
  duration: entry.duration,
  path: entry.path,
  href: entry.href,
}));

export const dashboardMilestones = [
  {
    label: "Sprint hari ini",
    value: "2 sesi fokus",
    note: "Mulai dari satu drill gratis lalu naik ke simulasi berdurasi penuh.",
  },
  {
    label: "Ritme stabil",
    value: `${platformSnapshot.averageDuration} menit rata-rata`,
    note: "Mayoritas set punya durasi cukup untuk sesi belajar serius tanpa burnout.",
  },
  {
    label: "Coverage",
    value: `${formatNumber(platformSnapshot.totalCategories)} jalur`,
    note: "Kategori besar tersedia untuk UTBK, CPNS, TKA, SMP, hingga SMK/SMA.",
  },
];

export { formatNumber, formatMode, slugifySegment };
