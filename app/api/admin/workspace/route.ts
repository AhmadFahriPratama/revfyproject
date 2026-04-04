import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/server-auth";
import { getAdminWorkspaceSnapshot } from "@/lib/server-admin";
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

  try {
    const workspace = await getAdminWorkspaceSnapshot();
    return NextResponse.json({ ok: true, ...workspace });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Workspace admin tidak bisa dimuat.",
      },
      { status: 500 },
    );
  }
}
