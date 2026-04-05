import { promises as fs } from "fs";
import path from "path";

import {
  allTryoutCatalog,
  formatNumber,
  getDailyTryoutRotation,
  materialTracks,
  type AccessTier,
  type MaterialTrack,
  type TryoutCard,
} from "@/lib/catalog";

type RawObjectQuestion = {
  id?: string;
  pertanyaan?: string;
  question?: string;
  opsi?: Record<string, string>;
  jawaban?: string;
  pembahasan?: string;
  trik?: string;
  topik?: string;
  mapel?: string;
  jenjang?: string;
  tingkat?: string;
};

export type PreviewQuestion = {
  id: string;
  question: string;
  options: Array<[string, string]>;
  answer: string;
  explanation: string;
  tip: string | null;
  topic: string | null;
  difficulty: string | null;
};

type DatasetSummary = {
  title: string;
  focus: string;
  duration: string;
  durationValue: number;
  totalQuestions: string;
  totalQuestionsValue: number;
  sampleQuestions: PreviewQuestion[];
  questions: PreviewQuestion[];
  extraMeta: Array<{ label: string; value: string }>;
};

type MaterialCategoryDetail = {
  track: MaterialTrack;
  relatedSets: TryoutCard[];
  modeSummary: Array<{ mode: string; total: string }>;
  tierSummary: Array<{ tier: AccessTier; total: string }>;
};

const dataRoot = path.join(process.cwd(), "data");

async function readLocalJson(relativePath: string) {
  const absolutePath = path.join(dataRoot, ...relativePath.split("/"));
  const raw = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function normalizeQuestion(raw: RawObjectQuestion, index: number): PreviewQuestion {
  return {
    id: raw.id ?? `question-${index + 1}`,
    question: raw.pertanyaan ?? raw.question ?? `Soal ${index + 1}`,
    options: Object.entries(raw.opsi ?? {}).slice(0, 5),
    answer: raw.jawaban ?? "-",
    explanation: raw.pembahasan ?? "Pembahasan belum tersedia pada file ini.",
    tip: raw.trik ?? null,
    topic: raw.topik ?? raw.mapel ?? null,
    difficulty: raw.tingkat ?? null,
  };
}

function summarizeArrayDataset(entry: TryoutCard, data: RawObjectQuestion[]): DatasetSummary {
  const first = data[0];
  const questions = data.map(normalizeQuestion);

  return {
    title: entry.title,
    focus: first?.mapel ?? entry.focus,
    duration: entry.duration,
    durationValue: entry.durationValue,
    totalQuestions: formatNumber(data.length),
    totalQuestionsValue: data.length,
    sampleQuestions: questions.slice(0, 5),
    questions,
    extraMeta: [
      { label: "Jenjang", value: first?.jenjang ?? entry.category },
      { label: "Mapel", value: first?.mapel ?? entry.category },
      { label: "Topik", value: first?.topik ?? "Umum / Terpadu" },
    ],
  };
}

function summarizeObjectDataset(
  entry: TryoutCard,
  data: { judul?: string; focus?: string; durasiMenit?: number; soal?: RawObjectQuestion[] },
): DatasetSummary {
  const questions = data.soal ?? [];
  const normalizedQuestions = questions.map(normalizeQuestion);

  return {
    title: data.judul ?? entry.title,
    focus: data.focus ?? entry.focus,
    duration: data.durasiMenit ? `${data.durasiMenit} menit` : entry.duration,
    durationValue: data.durasiMenit ?? entry.durationValue,
    totalQuestions: formatNumber(questions.length),
    totalQuestionsValue: questions.length,
    sampleQuestions: normalizedQuestions.slice(0, 5),
    questions: normalizedQuestions,
    extraMeta: [
      { label: "Mode", value: entry.mode },
      { label: "Kategori", value: entry.category },
      { label: "Sumber", value: entry.path },
    ],
  };
}

export async function getTryoutDetail(tier: AccessTier, slug: string) {
  const entry = getDailyTryoutRotation().all.find((candidate) => candidate.accessTier === tier && candidate.slug === slug);

  if (!entry) {
    return null;
  }

  const raw = await readLocalJson(entry.path);
  const summary = Array.isArray(raw)
    ? summarizeArrayDataset(entry, raw as RawObjectQuestion[])
    : summarizeObjectDataset(entry, raw as { judul?: string; focus?: string; durasiMenit?: number; soal?: RawObjectQuestion[] });

  return {
    entry,
    ...summary,
  };
}

export async function getSimulationPayload(tier: AccessTier, slug: string) {
  const detail = await getTryoutDetail(tier, slug);

  if (!detail) {
    return null;
  }

  const simulationCap = 100;
  const questionCount = Math.min(detail.questions.length, simulationCap);
  const simulationQuestions = detail.questions.slice(0, questionCount);

  if (simulationQuestions.length === 0) {
    return null;
  }

  const durationValue =
    detail.totalQuestionsValue > simulationCap ? Math.max(45, Math.round(questionCount * 1.1)) : detail.durationValue;

  return {
    title: detail.title,
    focus: detail.focus,
    entry: detail.entry,
    sourceQuestionCount: detail.totalQuestionsValue,
    simulationQuestionCount: questionCount,
    durationValue,
    duration: `${durationValue} menit`,
    adaptiveNote:
      detail.totalQuestionsValue > simulationCap
        ? `Dataset ini berisi ${formatNumber(detail.totalQuestionsValue)} soal, jadi simulasi dipadatkan menjadi ${formatNumber(questionCount)} soal pertama agar tetap nyaman dikerjakan di frontend.`
        : null,
    questions: simulationQuestions,
  };
}

export function getMaterialCategoryDetail(categorySlug: string): MaterialCategoryDetail | null {
  const track = materialTracks.find((candidate) => candidate.slug === categorySlug);

  if (!track) {
    return null;
  }

  const relatedSets = allTryoutCatalog
    .filter((entry) => entry.category === track.category)
    .sort((left, right) => right.itemCountValue - left.itemCountValue);

  const modeSummary = Array.from(
    relatedSets.reduce((accumulator, entry) => {
      accumulator.set(entry.mode, (accumulator.get(entry.mode) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>()),
  ).map(([mode, total]) => ({ mode, total: formatNumber(total) }));

  const tierSummary = ["gratis", "berbayar"].map((tier) => ({
    tier: tier as AccessTier,
    total: formatNumber(relatedSets.filter((entry) => entry.accessTier === tier).length),
  }));

  return {
    track,
    relatedSets,
    modeSummary,
    tierSummary,
  };
}

export function getMaterialCategorySlugs() {
  return materialTracks.map((track) => track.slug);
}

export function getTryoutDetailParams() {
  return getDailyTryoutRotation().all.map((entry) => ({
    tier: entry.accessTier,
    slug: entry.slug,
  }));
}
