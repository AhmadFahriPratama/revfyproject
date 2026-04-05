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

export async function ensureHistoryTables() {
  const pool = getDbPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      username VARCHAR(64) NOT NULL,
      tier ENUM('gratis', 'berbayar') NOT NULL,
      tryout_slug VARCHAR(191) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      focus VARCHAR(191) NOT NULL,
      current_index INT NOT NULL DEFAULT 0,
      remaining_seconds INT NOT NULL DEFAULT 0,
      question_count INT NOT NULL DEFAULT 0,
      answers_json LONGTEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_user_progress (username, tier, tryout_slug),
      KEY idx_user_progress_username (username),
      KEY idx_user_progress_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_attempts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      username VARCHAR(64) NOT NULL,
      tryout_slug VARCHAR(191) NOT NULL,
      tier ENUM('gratis', 'berbayar') NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      focus VARCHAR(191) NOT NULL,
      correct_count INT NOT NULL DEFAULT 0,
      answered_count INT NOT NULL DEFAULT 0,
      total_count INT NOT NULL DEFAULT 0,
      score INT NOT NULL DEFAULT 0,
      accuracy INT NOT NULL DEFAULT 0,
      duration_minutes INT NOT NULL DEFAULT 0,
      topic_breakdown_json LONGTEXT NOT NULL,
      completed_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_user_attempts_username (username),
      KEY idx_user_attempts_completed_at (completed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function loadProgress(username: string, tier: string, slug: string) {
  await ensureHistoryTables();
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
  await ensureHistoryTables();
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
  await ensureHistoryTables();
  const pool = getDbPool();
  await pool.execute(`DELETE FROM user_progress WHERE username = ? AND tier = ? AND tryout_slug = ?`, [username, tier, slug]);
}

export async function saveAttemptRecord(record: AttemptRecord) {
  await ensureHistoryTables();
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
  await ensureHistoryTables();
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
