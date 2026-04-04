import { NextRequest, NextResponse } from "next/server";

import { authenticateLogin } from "@/lib/server-auth";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const body = (await request.json()) as { username?: string; password?: string; focus?: string };

  try {
    const session = await authenticateLogin(body.username ?? "", body.password ?? "", body.focus ?? "");
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Login gagal.",
      },
      { status: 401 },
    );
  }
}
