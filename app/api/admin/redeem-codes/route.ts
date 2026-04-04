import { NextRequest, NextResponse } from "next/server";

import type { SessionPlan } from "@/lib/auth-types";
import { getServerSession } from "@/lib/server-auth";
import { createAdminRedeemCodes, listRedeemCodes } from "@/lib/server-admin";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPlan(value: string): value is SessionPlan {
  return value === "free" || value === "pro" || value === "elite";
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

  const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(50, Math.trunc(limitValue))) : 12;

  try {
    const codes = await listRedeemCodes({ limit });
    return NextResponse.json({ ok: true, codes });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Redeem code tidak bisa dimuat.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();

  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = (await request.json()) as {
    plan?: string;
    quantity?: number;
    prefix?: string;
    note?: string;
    expiresAt?: string;
    usageLimit?: number;
  };

  if (!body.plan || !isPlan(body.plan)) {
    return NextResponse.json({ ok: false, error: "Plan redeem code tidak valid." }, { status: 400 });
  }

  try {
    const codes = await createAdminRedeemCodes({
      plan: body.plan,
      quantity: Number(body.quantity ?? 1),
      prefix: body.prefix ?? "",
      note: body.note ?? "",
      expiresAt: body.expiresAt,
      usageLimit: Number(body.usageLimit ?? 1),
      createdByUsername: admin.username,
    });

    return NextResponse.json({ ok: true, codes });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Redeem code gagal dibuat.",
      },
      { status: 400 },
    );
  }
}
