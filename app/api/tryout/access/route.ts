import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/server-auth";
import { getTryoutAccessStatus, redeemTryoutAccessToken } from "@/lib/server-tryout-access";
import { isDatabaseConfigured } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isTier(value: string): value is "gratis" | "berbayar" {
  return value === "gratis" || value === "berbayar";
}

export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get("tier")?.trim() ?? "";
  const slug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";

  if (!slug || !isTier(tier)) {
    return NextResponse.json({ ok: false, error: "tier dan slug wajib diisi." }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    if (tier === "gratis") {
      return NextResponse.json({
        ok: true,
        access: {
          allowed: true,
          needsToken: false,
          reason: "Tryout gratis tetap bisa dimulai saat database belum aktif.",
          accessSource: "guest",
        },
      });
    }

    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const session = await getServerSession();
  const access = await getTryoutAccessStatus(session, tier, slug);
  return NextResponse.json({ ok: true, access });
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Login dibutuhkan untuk memakai token tryout." }, { status: 401 });
  }

  const body = (await request.json()) as { tier?: string; slug?: string; token?: string };

  if (!body.slug?.trim() || !isTier(body.tier ?? "")) {
    return NextResponse.json({ ok: false, error: "tier dan slug wajib diisi." }, { status: 400 });
  }

  const tier: "gratis" | "berbayar" = body.tier === "berbayar" ? "berbayar" : "gratis";
  const slug = body.slug.trim();

  try {
    const result = await redeemTryoutAccessToken({
      session,
      tier,
      slug,
      code: body.token ?? "",
    });

    const access = await getTryoutAccessStatus(session, tier, slug);
    return NextResponse.json({ ok: true, result, access });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Token tryout tidak bisa dipakai.",
      },
      { status: 400 },
    );
  }
}
