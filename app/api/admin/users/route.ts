import { NextRequest, NextResponse } from "next/server";

import type { SessionRole } from "@/lib/auth-types";
import { getServerSession } from "@/lib/server-auth";
import { listAdminUsers, updateAdminUserRole } from "@/lib/server-admin";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRole(value: string): value is SessionRole {
  return value === "student" || value === "admin";
}

async function requireAdmin() {
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

  return session;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();

  if (admin instanceof NextResponse) {
    return admin;
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? "24");
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(50, Math.trunc(limitValue))) : 24;

  try {
    const users = await listAdminUsers({ query, limit });
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Daftar user tidak bisa dimuat.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();

  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = (await request.json()) as { username?: string; role?: string };

  if (!body.username?.trim()) {
    return NextResponse.json({ ok: false, error: "Username user wajib diisi." }, { status: 400 });
  }

  if (!body.role || !isRole(body.role)) {
    return NextResponse.json({ ok: false, error: "Role user tidak valid." }, { status: 400 });
  }

  try {
    const user = await updateAdminUserRole({
      username: body.username,
      role: body.role,
      actorUsername: admin.username,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Role user tidak bisa diubah.",
      },
      { status: 400 },
    );
  }
}
