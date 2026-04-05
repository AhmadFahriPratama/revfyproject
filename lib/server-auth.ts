import "server-only";

import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";

import type { Session, SessionPlan, SessionRole } from "@/lib/auth-types";
import { getDbPool, isDatabaseConfigured, pingDatabase } from "@/lib/server-db";
import { ensureHistoryTables } from "@/lib/server-progress";

const scrypt = promisify(nodeScrypt);
const sessionCookieName = "revfy_session";
const sessionDurationDays = 30;

type UserRow = RowDataPacket & {
  id: number;
  username: string;
  password_hash: string;
  role: SessionRole;
  display_name: string;
  focus: string;
  plan: SessionPlan;
};

function getSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + sessionDurationDays);
  return expiresAt;
}

function toSession(user: Pick<UserRow, "username" | "display_name" | "role" | "plan" | "focus">): Session {
  return {
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    plan: user.plan,
    focus: user.focus,
    streak: user.role === "admin" ? 21 : 7,
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(hash, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}

function decodeBase32Secret(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalizedSecret = secret.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");

  if (!normalizedSecret) {
    throw new Error("Secret Google Authenticator kosong.");
  }

  let value = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (const character of normalizedSecret) {
    const index = alphabet.indexOf(character);

    if (index === -1) {
      throw new Error("Secret Google Authenticator harus berupa Base32.");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function createTotpCode(secret: Buffer, counter: number) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 15;
  const binaryCode =
    ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255);

  return String(binaryCode % 1000000).padStart(6, "0");
}

function verifyTotpCode(secret: string, authCode: string) {
  const normalizedCode = authCode.replace(/\s+/g, "");

  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const secretBuffer = decodeBase32Secret(secret);
  const currentCounter = Math.floor(Date.now() / 30000);
  const providedCodeBuffer = Buffer.from(normalizedCode);

  for (let offset = -1; offset <= 1; offset += 1) {
    const expectedCodeBuffer = Buffer.from(createTotpCode(secretBuffer, currentCounter + offset));

    if (timingSafeEqual(providedCodeBuffer, expectedCodeBuffer)) {
      return true;
    }
  }

  return false;
}

async function findUserByUsername(username: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id, username, password_hash, role, display_name, focus, plan
     FROM users
     WHERE username = ?
     LIMIT 1`,
    [username],
  );

  return rows[0] ?? null;
}

async function findUserById(id: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id, username, password_hash, role, display_name, focus, plan
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] ?? null;
}

export async function ensureAuthTables() {
  const pool = getDbPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      username VARCHAR(64) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
      display_name VARCHAR(128) NOT NULL,
      focus VARCHAR(191) NOT NULL DEFAULT 'General Focus',
      plan ENUM('free', 'pro', 'elite') NOT NULL DEFAULT 'free',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_users_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      session_token VARCHAR(128) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_user_sessions_token (session_token),
      KEY idx_user_sessions_user_id (user_id),
      KEY idx_user_sessions_expires_at (expires_at),
      CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      plan ENUM('free', 'pro', 'elite') NOT NULL,
      status ENUM('active', 'inactive', 'expired') NOT NULL DEFAULT 'active',
      started_at DATETIME NOT NULL,
      ends_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_subscriptions_user_id (user_id),
      KEY idx_subscriptions_status (status),
      CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function createUser(input: {
  username: string;
  password: string;
  role: SessionRole;
  displayName: string;
  focus: string;
  plan: SessionPlan;
}) {
  const pool = getDbPool();
  const passwordHash = await hashPassword(input.password);

  const [result] = await pool.execute(
    `INSERT INTO users (username, password_hash, role, display_name, focus, plan)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.username, passwordHash, input.role, input.displayName, input.focus, input.plan],
  );

  const user = await findUserById(Number((result as { insertId: number }).insertId));

  if (!user) {
    throw new Error("Gagal membuat user baru.");
  }

  return user;
}

async function updateUserProfile(id: number, focus: string) {
  const pool = getDbPool();
  await pool.execute(`UPDATE users SET focus = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [focus, id]);
}

async function updateUserPlan(userId: number, plan: SessionPlan) {
  const pool = getDbPool();

  await pool.execute(`UPDATE users SET plan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [plan, userId]);

  await pool.execute(
    `INSERT INTO subscriptions (user_id, plan, status, started_at, ends_at)
     VALUES (?, ?, 'active', CURRENT_TIMESTAMP, NULL)
     ON DUPLICATE KEY UPDATE
       plan = VALUES(plan),
       status = 'active',
       started_at = CURRENT_TIMESTAMP,
       ends_at = NULL,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, plan],
  );
}

async function createSessionToken(userId: number) {
  const pool = getDbPool();
  const token = randomBytes(32).toString("hex");
  const expiresAt = getSessionExpiry();

  await pool.execute(`INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)`, [userId, token, expiresAt]);

  return { token, expiresAt };
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function deleteSessionByToken(token: string) {
  const pool = getDbPool();
  await pool.execute(`DELETE FROM user_sessions WHERE session_token = ?`, [token]);
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getServerSession() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    await ensureAuthTables();

    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookieName)?.value;

    if (!token) {
      return null;
    }

    const pool = getDbPool();
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT u.id, u.username, u.password_hash, u.role, u.display_name, u.focus, u.plan
       FROM user_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
      [token],
    );

    const user = rows[0];
    return user ? toSession(user) : null;
  } catch {
    return null;
  }
}

export async function logoutServerSession() {
  if (!isDatabaseConfigured()) {
    return;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await deleteSessionByToken(token);
  }

  await clearAuthCookie();
}

export async function authenticateLogin(username: string, password: string, focus: string, authCode = "") {
  if (!isDatabaseConfigured()) {
    throw new Error("Database belum dikonfigurasi.");
  }

  await ensureAuthTables();

  const normalizedUsername = username.trim();
  const normalizedFocus = focus.trim() || "General Focus";
  const isBalrevLogin = normalizedUsername.toLowerCase() === "balrev";

  if (!normalizedUsername) {
    throw new Error("Username wajib diisi.");
  }

  if (!password.trim()) {
    throw new Error("Password wajib diisi.");
  }

  if (isBalrevLogin && !authCode.trim()) {
    throw new Error("Masukkan kode Google Authenticator untuk akun admin balrev.");
  }

  let user = await findUserByUsername(normalizedUsername);

  if (!user) {
    if (isBalrevLogin) {
      const adminPassword = process.env.BALREV_ADMIN_PASSWORD;
      const adminOtpSecret = process.env.BALREV_ADMIN_OTP_SECRET;

      if (!adminPassword) {
        throw new Error("BALREV_ADMIN_PASSWORD belum diatur di server.");
      }

      if (!adminOtpSecret) {
        throw new Error("BALREV_ADMIN_OTP_SECRET belum diatur di server.");
      }

      if (password !== adminPassword) {
        throw new Error("Password admin balrev tidak valid.");
      }

      if (!verifyTotpCode(adminOtpSecret, authCode)) {
        throw new Error("Kode Google Authenticator tidak valid.");
      }

      user = await createUser({
        username: normalizedUsername,
        password,
        role: "admin",
        displayName: "Balrev Control",
        focus: normalizedFocus,
        plan: "elite",
      });
    } else {
      user = await createUser({
        username: normalizedUsername,
        password,
        role: "student",
        displayName: normalizedUsername,
        focus: normalizedFocus,
        plan: "free",
      });
    }
  } else {
    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      throw new Error("Username atau password tidak cocok.");
    }

    if (isBalrevLogin) {
      const adminOtpSecret = process.env.BALREV_ADMIN_OTP_SECRET;

      if (!adminOtpSecret) {
        throw new Error("BALREV_ADMIN_OTP_SECRET belum diatur di server.");
      }

      if (!verifyTotpCode(adminOtpSecret, authCode)) {
        throw new Error("Kode Google Authenticator tidak valid.");
      }
    }

    await updateUserProfile(user.id, normalizedFocus);
    user = (await findUserById(user.id)) ?? user;
  }

  const { token, expiresAt } = await createSessionToken(user.id);
  await setSessionCookie(token, expiresAt);
  return toSession(user);
}

export async function updateSessionPlan(plan: SessionPlan) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database belum dikonfigurasi.");
  }

  await ensureAuthTables();

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    throw new Error("Sesi login tidak ditemukan.");
  }

  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT u.id, u.username, u.password_hash, u.role, u.display_name, u.focus, u.plan
     FROM user_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [token],
  );

  const user = rows[0] as UserRow | undefined;

  if (!user) {
    throw new Error("Sesi login tidak valid.");
  }

  await updateUserPlan(user.id, plan);
  const updatedUser = await findUserById(user.id);

  if (!updatedUser) {
    throw new Error("User tidak ditemukan setelah update plan.");
  }

  return toSession(updatedUser);
}

export async function getAdminDatabaseSummary() {
  await ensureAuthTables();
  await ensureHistoryTables();
  await pingDatabase();
  const pool = getDbPool();

  const [[userRow]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM users`);
  const [[sessionRow]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM user_sessions WHERE expires_at > CURRENT_TIMESTAMP`);
  const [[progressRow]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM user_progress`);
  const [[attemptRow]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM user_attempts`);
  const [[subscriptionRow]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM subscriptions WHERE status = 'active'`);

  return {
    users: Number(userRow.total ?? 0),
    sessions: Number(sessionRow.total ?? 0),
    progress: Number(progressRow.total ?? 0),
    attempts: Number(attemptRow.total ?? 0),
    subscriptions: Number(subscriptionRow.total ?? 0),
    connected: true,
  };
}
