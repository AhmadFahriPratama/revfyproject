import "server-only";

import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | null = null;

function getPort() {
  const raw = process.env.DB_PORT;
  const parsed = raw ? Number(raw) : 3306;
  return Number.isFinite(parsed) ? parsed : 3306;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);
}

export function getDbPool() {
  if (!isDatabaseConfigured()) {
    throw new Error("Database environment variables are not configured.");
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: getPort(),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionLimit: 10,
      waitForConnections: true,
      namedPlaceholders: false,
    });
  }

  return pool;
}

export async function pingDatabase() {
  const db = getDbPool();
  await db.query("SELECT 1");
  return true;
}
