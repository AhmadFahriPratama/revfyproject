import { NextRequest, NextResponse } from "next/server";

import { listQuestionSets } from "@/lib/server-content";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const sourceKindParam = request.nextUrl.searchParams.get("sourceKind");
  const sourceKind = sourceKindParam === "practice" || sourceKindParam === "tryout" ? sourceKindParam : null;

  const questionSets = await listQuestionSets({
    category: request.nextUrl.searchParams.get("category"),
    level: request.nextUrl.searchParams.get("level"),
    subject: request.nextUrl.searchParams.get("subject"),
    sourceKind,
    mode: request.nextUrl.searchParams.get("mode"),
    query: request.nextUrl.searchParams.get("q"),
    limit: Number(request.nextUrl.searchParams.get("limit") ?? 30),
  });

  return NextResponse.json({ ok: true, questionSets });
}
