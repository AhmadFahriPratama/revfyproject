import "server-only";

import type { RowDataPacket } from "mysql2";

import type {
  MaterialDetail,
  MaterialSection,
  MaterialSummary,
  QuestionDetail,
  QuestionOption,
  QuestionSetDetail,
  QuestionSetSummary,
} from "@/lib/content-types";
import { getDbPool } from "@/lib/server-db";

type MaterialRow = RowDataPacket & {
  id: number;
  slug: string;
  title: string;
  category: string;
  level_label: string | null;
  subject_name: string | null;
  summary: string | null;
  description: string | null;
  section_count: number;
  item_count: number;
  tags_json: string | null;
  source_path: string;
};

type MaterialSectionRow = RowDataPacket & {
  section_order: number;
  title: string;
  body: string;
};

type QuestionSetRow = RowDataPacket & {
  id: number;
  slug: string;
  title: string;
  category: string;
  level_label: string | null;
  subject_name: string | null;
  source_kind: "practice" | "tryout";
  mode: string | null;
  focus: string | null;
  description: string | null;
  item_count: number;
  duration_minutes: number | null;
  tags_json: string | null;
  source_path: string;
};

type QuestionRow = RowDataPacket & {
  id: number;
  source_question_id: string | null;
  question_order: number;
  question_text: string;
  answer_key: string;
  explanation: string | null;
  tip: string | null;
  topic: string | null;
  difficulty: string | null;
  level_label: string | null;
};

type QuestionOptionRow = RowDataPacket & {
  question_id: number;
  option_key: string;
  option_text: string;
  option_order: number;
};

function parseJsonArray(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as string[];
  }
}

function toMaterialSummary(row: MaterialRow): MaterialSummary {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    category: row.category,
    level: row.level_label,
    subject: row.subject_name,
    summary: row.summary,
    sectionCount: Number(row.section_count ?? 0),
    itemCount: Number(row.item_count ?? 0),
    tags: parseJsonArray(row.tags_json),
    sourcePath: row.source_path,
  };
}

function toQuestionSetSummary(row: QuestionSetRow): QuestionSetSummary {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    category: row.category,
    level: row.level_label,
    subject: row.subject_name,
    sourceKind: row.source_kind,
    mode: row.mode,
    focus: row.focus,
    description: row.description,
    itemCount: Number(row.item_count ?? 0),
    durationMinutes: row.duration_minutes === null ? null : Number(row.duration_minutes),
    tags: parseJsonArray(row.tags_json),
    sourcePath: row.source_path,
  };
}

export async function listMaterials(filters: {
  category?: string | null;
  level?: string | null;
  subject?: string | null;
  query?: string | null;
  limit?: number;
}) {
  const pool = getDbPool();
  const where: string[] = ["m.is_published = 1"];
  const params: Array<string | number> = [];

  if (filters.category) {
    where.push("m.category = ?");
    params.push(filters.category);
  }

  if (filters.level) {
    where.push("m.level_label = ?");
    params.push(filters.level);
  }

  if (filters.subject) {
    where.push("s.slug = ?");
    params.push(filters.subject);
  }

  if (filters.query) {
    where.push("(m.title LIKE ? OR m.summary LIKE ? OR s.name LIKE ?)");
    const like = `%${filters.query}%`;
    params.push(like, like, like);
  }

  const limit = Math.max(1, Math.min(filters.limit ?? 30, 100));
  params.push(limit);

  const [rows] = await pool.execute<MaterialRow[]>(
    `SELECT m.id, m.slug, m.title, m.category, m.level_label, s.name AS subject_name, m.summary, m.description, m.section_count, m.item_count, m.tags_json, m.source_path
     FROM materials m
     LEFT JOIN content_subjects s ON s.id = m.subject_id
     WHERE ${where.join(" AND ")}
     ORDER BY m.category ASC, m.title ASC
     LIMIT ?`,
    params,
  );

  return rows.map(toMaterialSummary);
}

export async function getMaterialDetail(slug: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<MaterialRow[]>(
    `SELECT m.id, m.slug, m.title, m.category, m.level_label, s.name AS subject_name, m.summary, m.description, m.section_count, m.item_count, m.tags_json, m.source_path
     FROM materials m
     LEFT JOIN content_subjects s ON s.id = m.subject_id
     WHERE m.slug = ? AND m.is_published = 1
     LIMIT 1`,
    [slug],
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  const [sectionRows] = await pool.execute<MaterialSectionRow[]>(
    `SELECT section_order, title, body
     FROM material_sections
     WHERE material_id = ?
     ORDER BY section_order ASC, id ASC`,
    [row.id],
  );

  const sections: MaterialSection[] = sectionRows.map((section) => ({
    order: Number(section.section_order ?? 0),
    title: section.title,
    body: section.body,
  }));

  const summary = toMaterialSummary(row);

  return {
    ...summary,
    description: row.description,
    sections,
  } satisfies MaterialDetail;
}

export async function listQuestionSets(filters: {
  category?: string | null;
  level?: string | null;
  subject?: string | null;
  sourceKind?: "practice" | "tryout" | null;
  mode?: string | null;
  query?: string | null;
  limit?: number;
}) {
  const pool = getDbPool();
  const where: string[] = ["qs.is_published = 1"];
  const params: Array<string | number> = [];

  if (filters.category) {
    where.push("qs.category = ?");
    params.push(filters.category);
  }

  if (filters.level) {
    where.push("qs.level_label = ?");
    params.push(filters.level);
  }

  if (filters.subject) {
    where.push("s.slug = ?");
    params.push(filters.subject);
  }

  if (filters.sourceKind) {
    where.push("qs.source_kind = ?");
    params.push(filters.sourceKind);
  }

  if (filters.mode) {
    where.push("qs.mode = ?");
    params.push(filters.mode);
  }

  if (filters.query) {
    where.push("(qs.title LIKE ? OR qs.description LIKE ? OR s.name LIKE ? OR qs.focus LIKE ?)");
    const like = `%${filters.query}%`;
    params.push(like, like, like, like);
  }

  const limit = Math.max(1, Math.min(filters.limit ?? 30, 100));
  params.push(limit);

  const [rows] = await pool.execute<QuestionSetRow[]>(
    `SELECT qs.id, qs.slug, qs.title, qs.category, qs.level_label, s.name AS subject_name, qs.source_kind, qs.mode, qs.focus, qs.description, qs.item_count, qs.duration_minutes, qs.tags_json, qs.source_path
     FROM question_sets qs
     LEFT JOIN content_subjects s ON s.id = qs.subject_id
     WHERE ${where.join(" AND ")}
     ORDER BY qs.category ASC, qs.title ASC
     LIMIT ?`,
    params,
  );

  return rows.map(toQuestionSetSummary);
}

export async function getQuestionSetDetail(slug: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<QuestionSetRow[]>(
    `SELECT qs.id, qs.slug, qs.title, qs.category, qs.level_label, s.name AS subject_name, qs.source_kind, qs.mode, qs.focus, qs.description, qs.item_count, qs.duration_minutes, qs.tags_json, qs.source_path
     FROM question_sets qs
     LEFT JOIN content_subjects s ON s.id = qs.subject_id
     WHERE qs.slug = ? AND qs.is_published = 1
     LIMIT 1`,
    [slug],
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  const [questionRows] = await pool.execute<QuestionRow[]>(
    `SELECT id, source_question_id, question_order, question_text, answer_key, explanation, tip, topic, difficulty, level_label
     FROM questions
     WHERE set_id = ?
     ORDER BY question_order ASC, id ASC`,
    [row.id],
  );

  const [optionRows] = await pool.execute<QuestionOptionRow[]>(
    `SELECT question_id, option_key, option_text, option_order
     FROM question_options
     WHERE question_id IN (${questionRows.map(() => "?").join(",") || "0"})
     ORDER BY option_order ASC, id ASC`,
    questionRows.length > 0 ? questionRows.map((question) => question.id) : [],
  );

  const optionsByQuestion = optionRows.reduce((accumulator, option) => {
    const bucket = accumulator.get(option.question_id) ?? [];
    bucket.push({
      key: option.option_key,
      text: option.option_text,
      order: Number(option.option_order ?? 0),
    } satisfies QuestionOption);
    accumulator.set(option.question_id, bucket);
    return accumulator;
  }, new Map<number, QuestionOption[]>());

  const questions: QuestionDetail[] = questionRows.map((question) => ({
    id: Number(question.id),
    questionCode: question.source_question_id,
    order: Number(question.question_order ?? 0),
    text: question.question_text,
    answerKey: question.answer_key,
    explanation: question.explanation,
    tip: question.tip,
    topic: question.topic,
    difficulty: question.difficulty,
    level: question.level_label,
    options: optionsByQuestion.get(question.id) ?? [],
  }));

  return {
    ...toQuestionSetSummary(row),
    questions,
  } satisfies QuestionSetDetail;
}

export async function listQuestions(filters: {
  setSlug?: string | null;
  category?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  sourceKind?: "practice" | "tryout" | null;
  limit?: number;
  offset?: number;
}) {
  const pool = getDbPool();
  const where: string[] = ["qs.is_published = 1"];
  const params: Array<string | number> = [];

  if (filters.setSlug) {
    where.push("qs.slug = ?");
    params.push(filters.setSlug);
  }

  if (filters.category) {
    where.push("qs.category = ?");
    params.push(filters.category);
  }

  if (filters.topic) {
    where.push("q.topic = ?");
    params.push(filters.topic);
  }

  if (filters.difficulty) {
    where.push("q.difficulty = ?");
    params.push(filters.difficulty);
  }

  if (filters.sourceKind) {
    where.push("qs.source_kind = ?");
    params.push(filters.sourceKind);
  }

  const limit = Math.max(1, Math.min(filters.limit ?? 25, 100));
  const offset = Math.max(0, filters.offset ?? 0);
  params.push(limit, offset);

  const [questionRows] = await pool.execute<(QuestionRow & { set_slug: string; set_title: string; source_kind: "practice" | "tryout" })[]>(
    `SELECT q.id, q.source_question_id, q.question_order, q.question_text, q.answer_key, q.explanation, q.tip, q.topic, q.difficulty, q.level_label,
            qs.slug AS set_slug, qs.title AS set_title, qs.source_kind
     FROM questions q
     INNER JOIN question_sets qs ON qs.id = q.set_id
     WHERE ${where.join(" AND ")}
     ORDER BY qs.title ASC, q.question_order ASC
     LIMIT ? OFFSET ?`,
    params,
  );

  const [optionRows] = await pool.execute<QuestionOptionRow[]>(
    `SELECT question_id, option_key, option_text, option_order
     FROM question_options
     WHERE question_id IN (${questionRows.map(() => "?").join(",") || "0"})
     ORDER BY option_order ASC, id ASC`,
    questionRows.length > 0 ? questionRows.map((question) => question.id) : [],
  );

  const optionsByQuestion = optionRows.reduce((accumulator, option) => {
    const bucket = accumulator.get(option.question_id) ?? [];
    bucket.push({
      key: option.option_key,
      text: option.option_text,
      order: Number(option.option_order ?? 0),
    } satisfies QuestionOption);
    accumulator.set(option.question_id, bucket);
    return accumulator;
  }, new Map<number, QuestionOption[]>());

  return questionRows.map((question) => ({
    id: Number(question.id),
    questionCode: question.source_question_id,
    order: Number(question.question_order ?? 0),
    text: question.question_text,
    answerKey: question.answer_key,
    explanation: question.explanation,
    tip: question.tip,
    topic: question.topic,
    difficulty: question.difficulty,
    level: question.level_label,
    options: optionsByQuestion.get(question.id) ?? [],
    setSlug: question.set_slug,
    setTitle: question.set_title,
    sourceKind: question.source_kind,
  }));
}
