import { NextResponse } from "next/server";

import { logoutServerSession } from "@/lib/server-auth";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  await logoutServerSession();
  return NextResponse.json({ ok: true });
}
