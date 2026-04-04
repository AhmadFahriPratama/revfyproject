import "server-only";

import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";

import type { Session, SessionPlan, SessionRole } from "@/lib/auth-types";
import { getDbPool, isDatabaseConfigured } from "@/lib/server-db";

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

export async function authenticateLogin(username: string, password: string, focus: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database belum dikonfigurasi.");
  }

  const normalizedUsername = username.trim();
  const normalizedFocus = focus.trim() || "General Focus";

  if (!normalizedUsername) {
    throw new Error("Username wajib diisi.");
  }

  if (!password.trim()) {
    throw new Error("Password wajib diisi.");
  }

  let user = await findUserByUsername(normalizedUsername);

  if (!user) {
    if (normalizedUsername.toLowerCase() === "balrev") {
      const adminPassword = process.env.BALREV_ADMIN_PASSWORD;

      if (!adminPassword) {
        throw new Error("BALREV_ADMIN_PASSWORD belum diatur di server.");
      }

      if (password !== adminPassword) {
        throw new Error("Password admin balrev tidak valid.");
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
  };
}
