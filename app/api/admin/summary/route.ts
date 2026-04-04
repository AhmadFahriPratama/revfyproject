import { NextResponse } from "next/server";

import { getAdminDatabaseSummary, getServerSession } from "@/lib/server-auth";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Akses admin dibutuhkan." }, { status: 403 });
  }

  const summary = await getAdminDatabaseSummary();
  return NextResponse.json({ ok: true, summary });
}
