import { NextRequest, NextResponse } from "next/server";

import type { ProgressRecord } from "@/lib/server-progress";
import { getServerSession } from "@/lib/server-auth";
import { clearProgress, loadProgress, saveProgress } from "@/lib/server-progress";
import { isDatabaseConfigured } from "@/lib/server-db";

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

  const tier = request.nextUrl.searchParams.get("tier")?.trim() ?? "";
  const slug = request.nextUrl.searchParams.get("slug")?.trim();

  if (!slug || !isTier(tier)) {
    return NextResponse.json({ ok: false, error: "tier dan slug wajib diisi." }, { status: 400 });
  }

  const progress = await loadProgress(session.username, tier, slug);

  if (!progress) {
    return NextResponse.json({ ok: false, error: "Progress belum ada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, progress });
}

export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return databaseUnavailable();
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ProgressRecord>;

  if (!body.slug || !body.title || !body.category || !body.focus || !isTier(body.tier ?? "")) {
    return NextResponse.json({ ok: false, error: "Payload progress tidak lengkap." }, { status: 400 });
  }

  const tier: ProgressRecord["tier"] = body.tier === "berbayar" ? "berbayar" : "gratis";

  const record: ProgressRecord = {
    username: session.username,
    tier,
    slug: String(body.slug).trim(),
    title: String(body.title).trim(),
    category: String(body.category).trim(),
    focus: String(body.focus).trim(),
    currentIndex: Number(body.currentIndex ?? 0),
    remainingSeconds: Number(body.remainingSeconds ?? 0),
    questionCount: Number(body.questionCount ?? 0),
    answers: body.answers && typeof body.answers === "object" ? body.answers : {},
  };

  await saveProgress(record);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return databaseUnavailable();
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
  }

  const body = (await request.json()) as { username?: string; tier?: string; slug?: string };

  if (!body.slug || !isTier(body.tier ?? "")) {
    return NextResponse.json({ ok: false, error: "tier dan slug wajib diisi." }, { status: 400 });
  }

  const slug = String(body.slug).trim();
  const tier: ProgressRecord["tier"] = body.tier === "berbayar" ? "berbayar" : "gratis";

  await clearProgress(session.username, tier, slug);
  return NextResponse.json({ ok: true });
}
