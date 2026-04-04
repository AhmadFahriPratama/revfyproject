import { NextRequest, NextResponse } from "next/server";

import { getMaterialDetail } from "@/lib/server-content";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, context: { params: Promise<{ slug: string }> }) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const { slug } = await context.params;
  const material = await getMaterialDetail(slug);

  if (!material) {
    return NextResponse.json({ ok: false, error: "Materi tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, material });
}
