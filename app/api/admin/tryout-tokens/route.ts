import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/server-auth";
import { createTryoutAccessTokens, getOrCreateDailyWhatsAppToken, listTryoutAccessTokens, updateTryoutAccessTokenStatus, type TokenScope, type TokenStatus } from "@/lib/server-tryout-access";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isTokenScope(value: string): value is TokenScope {
  return value === "gratis" || value === "berbayar" || value === "all";
}

function isFilterStatus(value: string): value is TokenStatus | "all" {
  return value === "all" || value === "active" || value === "disabled" || value === "expired" || value === "depleted";
}

function isEditableStatus(value: string): value is Extract<TokenStatus, "active" | "disabled"> {
  return value === "active" || value === "disabled";
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
  const requestedStatus = request.nextUrl.searchParams.get("status") ?? "all";
  const status = isFilterStatus(requestedStatus) ? requestedStatus : "all";

  try {
    const tokens = await listTryoutAccessTokens({ limit, status });
    return NextResponse.json({ ok: true, tokens });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Token tryout tidak bisa dimuat.",
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
    action?: string;
    tokenScope?: string;
    quantity?: number;
    prefix?: string;
    note?: string;
    expiresAt?: string;
    usageLimit?: number;
  };

  if (body.action === "generate_daily_whatsapp") {
    try {
      const token = await getOrCreateDailyWhatsAppToken({
        createdByUsername: admin.username,
        usageLimit: Number(body.usageLimit ?? 500),
      });

      return NextResponse.json({ ok: true, token });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Token harian WhatsApp gagal dibuat.",
        },
        { status: 400 },
      );
    }
  }

  if (!body.tokenScope || !isTokenScope(body.tokenScope)) {
    return NextResponse.json({ ok: false, error: "Scope token tidak valid." }, { status: 400 });
  }

  try {
    const tokens = await createTryoutAccessTokens({
      tokenScope: body.tokenScope,
      quantity: Number(body.quantity ?? 1),
      prefix: body.prefix ?? "TRY",
      note: body.note ?? "",
      expiresAt: body.expiresAt,
      usageLimit: Number(body.usageLimit ?? 1),
      createdByUsername: admin.username,
    });

    return NextResponse.json({ ok: true, tokens });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Token tryout gagal dibuat.",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();

  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = (await request.json()) as { tokenId?: number; status?: string };

  if (!Number.isFinite(Number(body.tokenId))) {
    return NextResponse.json({ ok: false, error: "Token id tidak valid." }, { status: 400 });
  }

  if (!body.status || !isEditableStatus(body.status)) {
    return NextResponse.json({ ok: false, error: "Status token tidak valid." }, { status: 400 });
  }

  try {
    const token = await updateTryoutAccessTokenStatus({ tokenId: Number(body.tokenId), status: body.status });
    return NextResponse.json({ ok: true, token });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Status token tidak bisa diubah.",
      },
      { status: 400 },
    );
  }
}
