import { NextRequest, NextResponse } from "next/server";

import { listQuestions } from "@/lib/server-content";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const sourceKindParam = request.nextUrl.searchParams.get("sourceKind");
  const sourceKind = sourceKindParam === "practice" || sourceKindParam === "tryout" ? sourceKindParam : null;

  const questions = await listQuestions({
    setSlug: request.nextUrl.searchParams.get("set"),
    category: request.nextUrl.searchParams.get("category"),
    topic: request.nextUrl.searchParams.get("topic"),
    difficulty: request.nextUrl.searchParams.get("difficulty"),
    sourceKind,
    limit: Number(request.nextUrl.searchParams.get("limit") ?? 25),
    offset: Number(request.nextUrl.searchParams.get("offset") ?? 0),
  });

  return NextResponse.json({ ok: true, questions });
}
