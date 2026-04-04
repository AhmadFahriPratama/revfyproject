import { NextRequest, NextResponse } from "next/server";

import type { AttemptRecord } from "@/lib/attempts";
import { isDatabaseConfigured } from "@/lib/server-db";
import { getServerSession } from "@/lib/server-auth";
import { listAttempts, saveAttemptRecord } from "@/lib/server-progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function databaseUnavailable() {
  return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
}

function isTier(value: string) {
  return value === "gratis" || value === "berbayar";
}

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return databaseUnavailable();
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
  }

  const requestedUsername = request.nextUrl.searchParams.get("username")?.trim();
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? 10);

  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 50)) : 10;
  const username = session.role === "admin" && requestedUsername ? requestedUsername : session.username;
  const attempts = await listAttempts(username, limit);
  return NextResponse.json({ ok: true, attempts });
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return databaseUnavailable();
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<AttemptRecord>;

  if (!body.slug || !body.title || !body.category || !body.focus || !isTier(body.tier ?? "")) {
    return NextResponse.json({ ok: false, error: "Payload attempt tidak lengkap." }, { status: 400 });
  }

  const tier: AttemptRecord["tier"] = body.tier === "berbayar" ? "berbayar" : "gratis";

  const record: AttemptRecord = {
    id: String(body.id ?? `${body.slug}-${Date.now()}`),
    title: String(body.title),
    slug: String(body.slug),
    tier,
    category: String(body.category),
    focus: String(body.focus),
    username: session.username,
    correct: Number(body.correct ?? 0),
    answered: Number(body.answered ?? 0),
    total: Number(body.total ?? 0),
    score: Number(body.score ?? 0),
    accuracy: Number(body.accuracy ?? 0),
    completedAt: body.completedAt ?? new Date().toISOString(),
    durationMinutes: Number(body.durationMinutes ?? 0),
    topicBreakdown: Array.isArray(body.topicBreakdown) ? body.topicBreakdown : [],
  };

  await saveAttemptRecord(record);

  return NextResponse.json({ ok: true });
}
