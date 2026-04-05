import "server-only";

import { randomBytes } from "crypto";

import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type { Session } from "@/lib/auth-types";
import { getDbPool, isDatabaseConfigured, pingDatabase } from "@/lib/server-db";
import { ensureAuthTables } from "@/lib/server-auth";
import { ensureHistoryTables } from "@/lib/server-progress";

type TokenScope = "gratis" | "berbayar" | "all";
type TokenStatus = "active" | "disabled" | "expired" | "depleted";

type TryoutAccessTokenRow = RowDataPacket & {
  id: number;
  code: string;
  token_scope: TokenScope;
  status: TokenStatus;
  usage_limit: number;
  usage_count: number;
  note: string | null;
  expires_at: string | Date | null;
  created_at: string | Date;
  created_by_username: string | null;
};

type AccessGrantRow = RowDataPacket & {
  id: number;
};

export type TryoutAccessToken = {
  id: number;
  code: string;
  tokenScope: TokenScope;
  status: TokenStatus;
  usageLimit: number;
  usageCount: number;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdByUsername: string | null;
};

export type TryoutAccessStatus = {
  allowed: boolean;
  needsToken: boolean;
  reason: string;
  accessSource: "guest" | "free" | "plan" | "token" | "login";
};

function formatToken(row: TryoutAccessTokenRow): TryoutAccessToken {
  return {
    id: Number(row.id),
    code: row.code,
    tokenScope: row.token_scope,
    status: row.status,
    usageLimit: Number(row.usage_limit ?? 0),
    usageCount: Number(row.usage_count ?? 0),
    note: row.note,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    createdByUsername: row.created_by_username,
  };
}

function buildTokenCode(prefix: string) {
  const normalizedPrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 10);
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  const serialPart = randomBytes(2).toString("hex").toUpperCase();
  return [normalizedPrefix || "TRY", randomPart, serialPart].join("-");
}

function getJakartaDateKey(date = new Date()) {
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = `${shifted.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${shifted.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

function getNextJakartaMidnight(date = new Date()) {
  const shiftedTime = date.getTime() + 7 * 60 * 60 * 1000;
  const dayNumber = Math.floor(shiftedTime / (24 * 60 * 60 * 1000));
  return new Date((dayNumber + 1) * 24 * 60 * 60 * 1000 - 7 * 60 * 60 * 1000);
}

async function findUserIdByUsername(username: string, connection?: PoolConnection) {
  const executor = connection ?? getDbPool();
  const [rows] = await executor.execute<RowDataPacket[]>(`SELECT id FROM users WHERE username = ? LIMIT 1`, [username]);
  const row = rows[0] as { id?: number } | undefined;
  return row?.id ? Number(row.id) : null;
}

async function refreshTokenStatuses(connection?: PoolConnection) {
  const executor = connection ?? getDbPool();

  await executor.execute(
    `UPDATE tryout_access_tokens
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`,
  );

  await executor.execute(
    `UPDATE tryout_access_tokens
     SET status = 'depleted', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active' AND usage_count >= usage_limit`,
  );
}

async function userHasGrant(userId: number, tier: "gratis" | "berbayar", slug: string, connection?: PoolConnection) {
  const executor = connection ?? getDbPool();
  const [rows] = await executor.execute<AccessGrantRow[]>(
    `SELECT id FROM tryout_access_grants WHERE user_id = ? AND tier = ? AND tryout_slug = ? LIMIT 1`,
    [userId, tier, slug],
  );

  return rows.length > 0;
}

export async function ensureTryoutAccessTables() {
  await ensureAuthTables();
  await ensureHistoryTables();

  const pool = getDbPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tryout_access_tokens (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(64) NOT NULL,
      token_scope ENUM('gratis', 'berbayar', 'all') NOT NULL DEFAULT 'berbayar',
      status ENUM('active', 'disabled', 'expired', 'depleted') NOT NULL DEFAULT 'active',
      usage_limit INT UNSIGNED NOT NULL DEFAULT 1,
      usage_count INT UNSIGNED NOT NULL DEFAULT 0,
      note VARCHAR(255) NULL,
      expires_at DATETIME NULL,
      created_by_user_id BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_tryout_access_tokens_code (code),
      KEY idx_tryout_access_tokens_scope (token_scope),
      KEY idx_tryout_access_tokens_status (status),
      KEY idx_tryout_access_tokens_expires_at (expires_at),
      CONSTRAINT fk_tryout_access_tokens_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tryout_access_grants (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      tier ENUM('gratis', 'berbayar') NOT NULL,
      tryout_slug VARCHAR(191) NOT NULL,
      token_id BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_tryout_access_grants_user_tryout (user_id, tier, tryout_slug),
      KEY idx_tryout_access_grants_tryout (tier, tryout_slug),
      CONSTRAINT fk_tryout_access_grants_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_tryout_access_grants_token FOREIGN KEY (token_id) REFERENCES tryout_access_tokens (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function getTryoutAccessStatus(session: Session | null, tier: "gratis" | "berbayar", slug: string): Promise<TryoutAccessStatus> {
  if (!isDatabaseConfigured()) {
    return tier === "gratis"
      ? {
          allowed: true,
          needsToken: false,
          reason: "Tryout gratis tetap bisa dimulai saat database belum aktif.",
          accessSource: session ? "free" : "guest",
        }
      : {
          allowed: false,
          needsToken: true,
          reason: "Database belum aktif, jadi validasi token tryout premium belum tersedia.",
          accessSource: "login",
        };
  }

  try {
    await ensureTryoutAccessTables();
    await refreshTokenStatuses();

    if (tier === "gratis") {
      return {
        allowed: true,
        needsToken: false,
        reason: "Tryout gratis bisa langsung dimulai.",
        accessSource: session ? "free" : "guest",
      };
    }

    if (!session) {
      return {
        allowed: false,
        needsToken: true,
        reason: "Login dulu untuk memakai plan aktif atau token tryout.",
        accessSource: "login",
      };
    }

    if (session.role === "admin" || session.plan === "pro" || session.plan === "elite") {
      return {
        allowed: true,
        needsToken: false,
        reason: "Akses premium aktif dari plan akun.",
        accessSource: "plan",
      };
    }

    const userId = await findUserIdByUsername(session.username);

    if (!userId) {
      return {
        allowed: false,
        needsToken: true,
        reason: "Akun belum sinkron dengan database. Silakan login ulang.",
        accessSource: "login",
      };
    }

    const hasGrant = await userHasGrant(userId, tier, slug);

    if (hasGrant) {
      return {
        allowed: true,
        needsToken: false,
        reason: "Token tryout sudah aktif untuk set ini.",
        accessSource: "token",
      };
    }

    return {
      allowed: false,
      needsToken: true,
      reason: "Tryout premium memerlukan plan aktif atau token mulai tryout.",
      accessSource: "token",
    };
  } catch {
    return tier === "gratis"
      ? {
          allowed: true,
          needsToken: false,
          reason: "Tryout gratis tetap bisa dimulai saat koneksi database sedang bermasalah.",
          accessSource: session ? "free" : "guest",
        }
      : {
          allowed: false,
          needsToken: true,
          reason: "Koneksi database sedang bermasalah, jadi validasi token premium belum tersedia.",
          accessSource: "login",
        };
  }
}

export async function redeemTryoutAccessToken({
  session,
  tier,
  slug,
  code,
}: {
  session: Session;
  tier: "gratis" | "berbayar";
  slug: string;
  code: string;
}) {
  await ensureTryoutAccessTables();
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await refreshTokenStatuses(connection);

    const userId = await findUserIdByUsername(session.username, connection);

    if (!userId) {
      throw new Error("Akun Anda belum tersedia di database. Silakan login ulang.");
    }

    const hasGrant = await userHasGrant(userId, tier, slug, connection);

    if (hasGrant) {
      await connection.commit();
      return { ok: true, reason: "Tryout ini sudah aktif untuk akun Anda." };
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      throw new Error("Token tryout wajib diisi.");
    }

    const [rows] = await connection.execute<TryoutAccessTokenRow[]>(
      `SELECT
         t.id,
         t.code,
         t.token_scope,
         t.status,
         t.usage_limit,
         t.usage_count,
         t.note,
         t.expires_at,
         t.created_at,
         creator.username AS created_by_username
       FROM tryout_access_tokens t
       LEFT JOIN users creator ON creator.id = t.created_by_user_id
       WHERE t.code = ?
       LIMIT 1
       FOR UPDATE`,
      [normalizedCode],
    );

    const token = rows[0];

    if (!token) {
      throw new Error("Token tryout tidak ditemukan.");
    }

    if (token.status !== "active") {
      throw new Error(token.status === "expired" ? "Token tryout sudah expired." : token.status === "depleted" ? "Kuota token tryout sudah habis." : "Token tryout sedang nonaktif.");
    }

    if (token.token_scope !== "all" && token.token_scope !== tier) {
      throw new Error("Token ini tidak berlaku untuk tryout yang dipilih.");
    }

    if (Number(token.usage_count ?? 0) >= Number(token.usage_limit ?? 0)) {
      throw new Error("Kuota token tryout sudah habis.");
    }

    await connection.execute<ResultSetHeader>(
      `INSERT INTO tryout_access_grants (user_id, tier, tryout_slug, token_id) VALUES (?, ?, ?, ?)`,
      [userId, tier, slug, token.id],
    );

    const nextUsageCount = Number(token.usage_count ?? 0) + 1;
    const nextStatus: TokenStatus = nextUsageCount >= Number(token.usage_limit ?? 0) ? "depleted" : "active";

    await connection.execute(
      `UPDATE tryout_access_tokens SET usage_count = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [nextUsageCount, nextStatus, token.id],
    );

    await connection.commit();

    return { ok: true, reason: `Token berhasil dipakai. Akses untuk tryout ${slug} sudah aktif.` };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listTryoutAccessTokens({ limit = 12, status = "all" }: { limit?: number; status?: TokenStatus | "all" }) {
  await ensureTryoutAccessTables();
  await refreshTokenStatuses();

  const pool = getDbPool();
  const [rows] = await pool.execute<TryoutAccessTokenRow[]>(
    `SELECT
       t.id,
       t.code,
       t.token_scope,
       t.status,
       t.usage_limit,
       t.usage_count,
       t.note,
       t.expires_at,
       t.created_at,
       creator.username AS created_by_username
      FROM tryout_access_tokens t
     LEFT JOIN users creator ON creator.id = t.created_by_user_id
     WHERE (? = 'all' OR t.status = ?)
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT ?`,
    [status, status, limit],
  );

  return rows.map(formatToken);
}

export async function updateTryoutAccessTokenStatus({ tokenId, status }: { tokenId: number; status: Extract<TokenStatus, "active" | "disabled"> }) {
  await ensureTryoutAccessTables();
  await refreshTokenStatuses();

  const pool = getDbPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE tryout_access_tokens
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status NOT IN ('expired', 'depleted')`,
    [status, tokenId],
  );

  if (result.affectedRows === 0) {
    throw new Error("Token tidak ditemukan atau statusnya tidak bisa diubah.");
  }

  const [rows] = await pool.execute<TryoutAccessTokenRow[]>(
    `SELECT
       t.id,
       t.code,
       t.token_scope,
       t.status,
       t.usage_limit,
       t.usage_count,
       t.note,
       t.expires_at,
       t.created_at,
       creator.username AS created_by_username
     FROM tryout_access_tokens t
     LEFT JOIN users creator ON creator.id = t.created_by_user_id
     WHERE t.id = ?
     LIMIT 1`,
    [tokenId],
  );

  const token = rows[0];

  if (!token) {
    throw new Error("Token tidak ditemukan setelah update.");
  }

  return formatToken(token);
}

export async function createTryoutAccessTokens({
  tokenScope,
  quantity,
  prefix,
  note,
  expiresAt,
  usageLimit,
  createdByUsername,
}: {
  tokenScope: TokenScope;
  quantity: number;
  prefix: string;
  note: string;
  expiresAt?: string;
  usageLimit: number;
  createdByUsername: string;
}) {
  await ensureTryoutAccessTables();

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error("Jumlah token harus antara 1 sampai 20.");
  }

  if (!Number.isInteger(usageLimit) || usageLimit < 1 || usageLimit > 5000) {
    throw new Error("Batas pemakaian token harus antara 1 sampai 5000.");
  }

  const parsedExpiry = expiresAt ? new Date(expiresAt) : null;

  if (parsedExpiry && Number.isNaN(parsedExpiry.getTime())) {
    throw new Error("Tanggal expired token tidak valid.");
  }

  const creatorId = await findUserIdByUsername(createdByUsername);
  const pool = getDbPool();
  const insertedIds: number[] = [];

  for (let index = 0; index < quantity; index += 1) {
    let inserted = false;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = buildTokenCode(prefix);

      try {
        const [result] = await pool.execute<ResultSetHeader>(
          `INSERT INTO tryout_access_tokens (
             code,
             token_scope,
             status,
             usage_limit,
             usage_count,
             note,
             expires_at,
             created_by_user_id
           ) VALUES (?, ?, 'active', ?, 0, ?, ?, ?)`,
          [code, tokenScope, usageLimit, note.trim() || null, parsedExpiry, creatorId],
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
      throw new Error("Gagal membuat token unik. Silakan coba lagi.");
    }
  }

  const placeholders = insertedIds.map(() => "?").join(", ");
  const [rows] = await pool.execute<TryoutAccessTokenRow[]>(
    `SELECT
       t.id,
       t.code,
       t.token_scope,
       t.status,
       t.usage_limit,
       t.usage_count,
       t.note,
       t.expires_at,
       t.created_at,
       creator.username AS created_by_username
     FROM tryout_access_tokens t
     LEFT JOIN users creator ON creator.id = t.created_by_user_id
     WHERE t.id IN (${placeholders})
     ORDER BY t.created_at DESC, t.id DESC`,
    insertedIds,
  );

  return rows.map(formatToken);
}

export async function getOrCreateDailyWhatsAppToken({
  createdByUsername,
  usageLimit = 500,
}: {
  createdByUsername: string;
  usageLimit?: number;
}) {
  await ensureTryoutAccessTables();
  await refreshTokenStatuses();

  const dateKey = getJakartaDateKey();
  const dailyNote = `WhatsApp daily token ${dateKey}`;
  const pool = getDbPool();
  const [existingRows] = await pool.execute<TryoutAccessTokenRow[]>(
    `SELECT
       t.id,
       t.code,
       t.token_scope,
       t.status,
       t.usage_limit,
       t.usage_count,
       t.note,
       t.expires_at,
       t.created_at,
       creator.username AS created_by_username
     FROM tryout_access_tokens t
     LEFT JOIN users creator ON creator.id = t.created_by_user_id
     WHERE t.note = ?
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT 1`,
    [dailyNote],
  );

  const existing = existingRows[0];

  if (existing) {
    return formatToken(existing);
  }

  const tokens = await createTryoutAccessTokens({
    tokenScope: "berbayar",
    quantity: 1,
    prefix: `WA${dateKey.slice(2)}`,
    note: dailyNote,
    expiresAt: getNextJakartaMidnight().toISOString(),
    usageLimit,
    createdByUsername,
  });

  const token = tokens[0];

  if (!token) {
    throw new Error("Token harian WhatsApp gagal dibuat.");
  }

  return token;
}

export async function getTryoutAccessAdminSummary() {
  await ensureTryoutAccessTables();
  await refreshTokenStatuses();
  await pingDatabase();

  const pool = getDbPool();
  const [[tokenRow]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM tryout_access_tokens`);
  const [[activeTokenRow]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM tryout_access_tokens WHERE status = 'active'`);
  const [[grantRow]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM tryout_access_grants`);

  return {
    totalTokens: Number(tokenRow.total ?? 0),
    activeTokens: Number(activeTokenRow.total ?? 0),
    totalGrants: Number(grantRow.total ?? 0),
    connected: true,
  };
}

export type { TokenScope, TokenStatus };
