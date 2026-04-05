import "server-only";

import { randomBytes } from "crypto";

import type { ResultSetHeader, RowDataPacket } from "mysql2";

import type { SessionPlan, SessionRole } from "@/lib/auth-types";
import { pingDatabase } from "@/lib/server-db";
import { getDbPool } from "@/lib/server-db";
import { ensureAuthTables } from "@/lib/server-auth";
import { ensureHistoryTables } from "@/lib/server-progress";
import { ensureTryoutAccessTables } from "@/lib/server-tryout-access";

type CountRow = RowDataPacket & {
  total: number;
};

type RoleBreakdownRow = RowDataPacket & {
  role: SessionRole;
  total: number;
};

type PlanBreakdownRow = RowDataPacket & {
  plan: SessionPlan;
  total: number;
};

type UserListRow = RowDataPacket & {
  id: number;
  username: string;
  display_name: string;
  role: SessionRole;
  plan: SessionPlan;
  focus: string;
  created_at: string | Date;
  updated_at: string | Date;
  active_sessions: number;
};

type RedeemCodeRow = RowDataPacket & {
  id: number;
  code: string;
  plan: SessionPlan;
  status: "active" | "redeemed" | "disabled" | "expired";
  usage_limit: number;
  usage_count: number;
  note: string | null;
  expires_at: string | Date | null;
  created_at: string | Date;
  created_by_username: string | null;
  redeemed_by_username: string | null;
};

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function formatUser(row: UserListRow) {
  return {
    id: Number(row.id),
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    plan: row.plan,
    focus: row.focus,
    activeSessions: Number(row.active_sessions ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function formatRedeemCode(row: RedeemCodeRow) {
  return {
    id: Number(row.id),
    code: row.code,
    plan: row.plan,
    status: row.status,
    usageLimit: Number(row.usage_limit ?? 0),
    usageCount: Number(row.usage_count ?? 0),
    note: row.note,
    expiresAt: toIsoString(row.expires_at),
    createdAt: new Date(row.created_at).toISOString(),
    createdByUsername: row.created_by_username,
    redeemedByUsername: row.redeemed_by_username,
  };
}

function buildRedeemCode(prefix: string) {
  const normalizedPrefix = prefix
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
  const randomPart = randomBytes(4).toString("hex").toUpperCase();
  const serialPart = randomBytes(2).toString("hex").toUpperCase();
  return ["REVFY", normalizedPrefix || null, randomPart, serialPart].filter(Boolean).join("-");
}

async function refreshRedeemCodeStatuses() {
  const pool = getDbPool();

  await pool.execute(
    `UPDATE redeem_codes
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`,
  );
}

async function findUserIdByUsername(username: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id FROM users WHERE username = ? LIMIT 1`, [username]);
  const row = rows[0] as { id?: number } | undefined;
  return row?.id ? Number(row.id) : null;
}

export async function ensureAdminTables() {
  await ensureAuthTables();
  const pool = getDbPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS redeem_codes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(64) NOT NULL,
      plan ENUM('free', 'pro', 'elite') NOT NULL,
      status ENUM('active', 'redeemed', 'disabled', 'expired') NOT NULL DEFAULT 'active',
      usage_limit INT UNSIGNED NOT NULL DEFAULT 1,
      usage_count INT UNSIGNED NOT NULL DEFAULT 0,
      note VARCHAR(255) NULL,
      expires_at DATETIME NULL,
      created_by_user_id BIGINT UNSIGNED NULL,
      redeemed_by_user_id BIGINT UNSIGNED NULL,
      redeemed_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_redeem_codes_code (code),
      KEY idx_redeem_codes_status (status),
      KEY idx_redeem_codes_plan (plan),
      KEY idx_redeem_codes_expires_at (expires_at),
      CONSTRAINT fk_redeem_codes_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
      CONSTRAINT fk_redeem_codes_redeemed_by FOREIGN KEY (redeemed_by_user_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function listAdminUsers({ query = "", limit = 24 }: { query?: string; limit?: number }) {
  const pool = getDbPool();
  const normalizedQuery = query.trim().toLowerCase();
  const likeQuery = `%${normalizedQuery}%`;

  const [rows] = await pool.execute<UserListRow[]>(
    `SELECT
       u.id,
       u.username,
       u.display_name,
       u.role,
       u.plan,
       u.focus,
       u.created_at,
       u.updated_at,
       COALESCE(SUM(CASE WHEN s.expires_at > CURRENT_TIMESTAMP THEN 1 ELSE 0 END), 0) AS active_sessions
     FROM users u
     LEFT JOIN user_sessions s ON s.user_id = u.id
     WHERE (? = '' OR LOWER(u.username) LIKE ? OR LOWER(u.display_name) LIKE ? OR LOWER(u.focus) LIKE ?)
     GROUP BY u.id, u.username, u.display_name, u.role, u.plan, u.focus, u.created_at, u.updated_at
     ORDER BY u.updated_at DESC, u.created_at DESC
     LIMIT ?`,
    [normalizedQuery, likeQuery, likeQuery, likeQuery, limit],
  );

  return rows.map(formatUser);
}

export async function updateAdminUserRole({
  username,
  role,
  actorUsername,
}: {
  username: string;
  role: SessionRole;
  actorUsername: string;
}) {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    throw new Error("Username user wajib diisi.");
  }

  if (normalizedUsername.toLowerCase() === actorUsername.trim().toLowerCase()) {
    throw new Error("Role akun admin yang sedang aktif tidak bisa diubah dari panel ini.");
  }

  const pool = getDbPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ? LIMIT 1`,
    [role, normalizedUsername],
  );

  if (result.affectedRows === 0) {
    throw new Error("User tidak ditemukan.");
  }

  const users = await listAdminUsers({ query: normalizedUsername, limit: 1 });
  const user = users.find((item) => item.username.toLowerCase() === normalizedUsername.toLowerCase());

  if (!user) {
    throw new Error("User tidak ditemukan setelah update role.");
  }

  return user;
}

export async function listRedeemCodes({ limit = 12 }: { limit?: number }) {
  await ensureAdminTables();
  await refreshRedeemCodeStatuses();

  const pool = getDbPool();
  const [rows] = await pool.execute<RedeemCodeRow[]>(
    `SELECT
       rc.id,
       rc.code,
       rc.plan,
       rc.status,
       rc.usage_limit,
       rc.usage_count,
       rc.note,
       rc.expires_at,
       rc.created_at,
       creator.username AS created_by_username,
       redeemer.username AS redeemed_by_username
     FROM redeem_codes rc
     LEFT JOIN users creator ON creator.id = rc.created_by_user_id
     LEFT JOIN users redeemer ON redeemer.id = rc.redeemed_by_user_id
     ORDER BY rc.created_at DESC, rc.id DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map(formatRedeemCode);
}

export async function createAdminRedeemCodes({
  plan,
  quantity,
  prefix,
  note,
  expiresAt,
  usageLimit,
  createdByUsername,
}: {
  plan: SessionPlan;
  quantity: number;
  prefix: string;
  note: string;
  expiresAt?: string;
  usageLimit: number;
  createdByUsername: string;
}) {
  await ensureAdminTables();

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error("Jumlah redeem code harus antara 1 sampai 20.");
  }

  if (!Number.isInteger(usageLimit) || usageLimit < 1 || usageLimit > 100) {
    throw new Error("Batas pemakaian redeem code harus antara 1 sampai 100.");
  }

  const parsedExpiry = expiresAt ? new Date(expiresAt) : null;

  if (parsedExpiry && Number.isNaN(parsedExpiry.getTime())) {
    throw new Error("Tanggal expired redeem code tidak valid.");
  }

  const creatorId = await findUserIdByUsername(createdByUsername);
  const pool = getDbPool();
  const insertedIds: number[] = [];

  for (let index = 0; index < quantity; index += 1) {
    let inserted = false;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = buildRedeemCode(prefix);

      try {
        const [result] = await pool.execute<ResultSetHeader>(
          `INSERT INTO redeem_codes (
             code,
             plan,
             status,
             usage_limit,
             usage_count,
             note,
             expires_at,
             created_by_user_id
           ) VALUES (?, ?, 'active', ?, 0, ?, ?, ?)`,
          [code, plan, usageLimit, note.trim() || null, parsedExpiry, creatorId],
        );

        insertedIds.push(Number(result.insertId));
        inserted = true;
        break;
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
          continue;
        }

        throw error;
      }
    }

    if (!inserted) {
      throw new Error("Gagal membuat redeem code unik. Silakan coba lagi.");
    }
  }

  const placeholders = insertedIds.map(() => "?").join(", ");
  const [rows] = await pool.execute<RedeemCodeRow[]>(
    `SELECT
       rc.id,
       rc.code,
       rc.plan,
       rc.status,
       rc.usage_limit,
       rc.usage_count,
       rc.note,
       rc.expires_at,
       rc.created_at,
       creator.username AS created_by_username,
       redeemer.username AS redeemed_by_username
     FROM redeem_codes rc
     LEFT JOIN users creator ON creator.id = rc.created_by_user_id
     LEFT JOIN users redeemer ON redeemer.id = rc.redeemed_by_user_id
     WHERE rc.id IN (${placeholders})
     ORDER BY rc.created_at DESC, rc.id DESC`,
    insertedIds,
  );

  return rows.map(formatRedeemCode);
}

export async function getAdminWorkspaceSnapshot() {
  await ensureAuthTables();
  await ensureHistoryTables();
  await ensureAdminTables();
  await ensureTryoutAccessTables();
  await refreshRedeemCodeStatuses();
  await pingDatabase();

  const pool = getDbPool();

  const [[userRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM users`);
  const [[adminRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM users WHERE role = 'admin'`);
  const [[sessionRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM user_sessions WHERE expires_at > CURRENT_TIMESTAMP`);
  const [[progressRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM user_progress`);
  const [[attemptRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM user_attempts`);
  const [[subscriptionRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM subscriptions WHERE status = 'active'`);
  const [[redeemRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM redeem_codes`);
  const [[activeRedeemRow]] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) AS total FROM redeem_codes WHERE status = 'active' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
  );
  const [[tryoutTokenRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM tryout_access_tokens`);
  const [[activeTryoutTokenRow]] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM tryout_access_tokens WHERE status = 'active'`);

  const [roleRows] = await pool.execute<RoleBreakdownRow[]>(
    `SELECT role, COUNT(*) AS total FROM users GROUP BY role ORDER BY total DESC, role ASC`,
  );
  const [planRows] = await pool.execute<PlanBreakdownRow[]>(
    `SELECT plan, COUNT(*) AS total FROM users GROUP BY plan ORDER BY total DESC, plan ASC`,
  );

  const recentUsers = await listAdminUsers({ limit: 8 });
  const recentRedeemCodes = await listRedeemCodes({ limit: 8 });

  return {
    summary: {
      users: Number(userRow.total ?? 0),
      admins: Number(adminRow.total ?? 0),
      students: Math.max(0, Number(userRow.total ?? 0) - Number(adminRow.total ?? 0)),
      sessions: Number(sessionRow.total ?? 0),
      progress: Number(progressRow.total ?? 0),
      attempts: Number(attemptRow.total ?? 0),
      subscriptions: Number(subscriptionRow.total ?? 0),
      redeemCodes: Number(redeemRow.total ?? 0),
      activeRedeemCodes: Number(activeRedeemRow.total ?? 0),
      tryoutTokens: Number(tryoutTokenRow.total ?? 0),
      activeTryoutTokens: Number(activeTryoutTokenRow.total ?? 0),
      databaseConnected: 1,
    },
    roleBreakdown: roleRows.map((row) => ({ role: row.role, total: Number(row.total ?? 0) })),
    planBreakdown: planRows.map((row) => ({ plan: row.plan, total: Number(row.total ?? 0) })),
    recentUsers,
    recentRedeemCodes,
  };
}
