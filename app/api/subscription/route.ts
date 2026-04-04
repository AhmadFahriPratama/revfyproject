import { NextRequest, NextResponse } from "next/server";

import type { SessionPlan } from "@/lib/auth-types";
import { getServerSession, updateSessionPlan } from "@/lib/server-auth";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";

function isPlan(value: string): value is SessionPlan {
  return value === "free" || value === "pro" || value === "elite";
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, plan: session.plan });
}

export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
  }

  const body = (await request.json()) as { plan?: string };

  if (!body.plan || !isPlan(body.plan)) {
    return NextResponse.json({ ok: false, error: "Plan tidak valid." }, { status: 400 });
  }

  const nextSession = await updateSessionPlan(body.plan);
  return NextResponse.json({ ok: true, session: nextSession });
}
