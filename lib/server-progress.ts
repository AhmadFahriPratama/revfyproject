import "server-only";

import type { RowDataPacket } from "mysql2";

import type { AttemptRecord } from "@/lib/attempts";
import { getDbPool } from "@/lib/server-db";

export type ProgressRecord = {
  username: string;
  tier: "gratis" | "berbayar";
  slug: string;
  title: string;
  category: string;
  focus: string;
  currentIndex: number;
  remainingSeconds: number;
  questionCount: number;
  answers: Record<string, string>;
  updatedAt?: string;
};

function safeParseJson(value: string | null | undefined) {
  if (!value) {
    return {} as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {} as Record<string, string>;
  }
}

function safeParseArrayJson(value: string | null | undefined) {
  if (!value) {
    return [] as AttemptRecord["topicBreakdown"];
  }

  try {
    const parsed = JSON.parse(value) as AttemptRecord["topicBreakdown"];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as AttemptRecord["topicBreakdown"];
  }
}

export async function loadProgress(username: string, tier: string, slug: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT username, tier, tryout_slug, title, category, focus, current_index, remaining_seconds, question_count, answers_json, updated_at
     FROM user_progress
     WHERE username = ? AND tier = ? AND tryout_slug = ?
     LIMIT 1`,
    [username, tier, slug],
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    username: String(row.username),
    tier: row.tier === "berbayar" ? "berbayar" : "gratis",
    slug: String(row.tryout_slug),
    title: String(row.title),
    category: String(row.category),
    focus: String(row.focus),
    currentIndex: Number(row.current_index ?? 0),
    remainingSeconds: Number(row.remaining_seconds ?? 0),
    questionCount: Number(row.question_count ?? 0),
    answers: safeParseJson(row.answers_json as string | null),
    updatedAt: row.updated_at ? new Date(row.updated_at as string | number | Date).toISOString() : undefined,
  } satisfies ProgressRecord;
}

export async function saveProgress(record: ProgressRecord) {
  const pool = getDbPool();
  await pool.execute(
    `INSERT INTO user_progress (
      username,
      tier,
      tryout_slug,
      title,
      category,
      focus,
      current_index,
      remaining_seconds,
      question_count,
      answers_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      category = VALUES(category),
      focus = VALUES(focus),
      current_index = VALUES(current_index),
      remaining_seconds = VALUES(remaining_seconds),
      question_count = VALUES(question_count),
      answers_json = VALUES(answers_json),
      updated_at = CURRENT_TIMESTAMP`,
    [
      record.username,
      record.tier,
      record.slug,
      record.title,
      record.category,
      record.focus,
      record.currentIndex,
      record.remainingSeconds,
      record.questionCount,
      JSON.stringify(record.answers),
    ],
  );

  return record;
}

export async function clearProgress(username: string, tier: string, slug: string) {
  const pool = getDbPool();
  await pool.execute(`DELETE FROM user_progress WHERE username = ? AND tier = ? AND tryout_slug = ?`, [username, tier, slug]);
}

export async function saveAttemptRecord(record: AttemptRecord) {
  const pool = getDbPool();
  await pool.execute(
    `INSERT INTO user_attempts (
      username,
      tryout_slug,
      tier,
      title,
      category,
      focus,
      correct_count,
      answered_count,
      total_count,
      score,
      accuracy,
      duration_minutes,
      topic_breakdown_json,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      record.username,
      record.slug,
      record.tier,
      record.title,
      record.category,
      record.focus,
      record.correct,
      record.answered,
      record.total,
      record.score,
      record.accuracy,
      record.durationMinutes,
      JSON.stringify(record.topicBreakdown),
      new Date(record.completedAt),
    ],
  );

  return record;
}

export async function listAttempts(username: string, limit: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT username, tryout_slug, tier, title, category, focus, correct_count, answered_count, total_count, score, accuracy, duration_minutes, topic_breakdown_json, completed_at, created_at
     FROM user_attempts
     WHERE username = ?
     ORDER BY completed_at DESC, id DESC
     LIMIT ?`,
    [username, limit],
  );

  return rows.map((row) => ({
    username: String(row.username),
    slug: String(row.tryout_slug),
    tier: row.tier === "berbayar" ? "berbayar" : "gratis",
    title: String(row.title),
    category: String(row.category),
    focus: String(row.focus),
    correct: Number(row.correct_count ?? 0),
    answered: Number(row.answered_count ?? 0),
    total: Number(row.total_count ?? 0),
    score: Number(row.score ?? 0),
    accuracy: Number(row.accuracy ?? 0),
    durationMinutes: Number(row.duration_minutes ?? 0),
    topicBreakdown: safeParseArrayJson(row.topic_breakdown_json as string | null),
    completedAt: new Date(row.completed_at as string | number | Date).toISOString(),
    id: `${String(row.tryout_slug)}-${String(row.completed_at)}`,
  })) satisfies AttemptRecord[];
}
