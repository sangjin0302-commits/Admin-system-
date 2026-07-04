import { NextResponse } from "next/server";
import { getPublicFlags } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const flags = await getPublicFlags();
    return NextResponse.json(
      { ok: true, flags },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } }
    );
  } catch (err) {
    logger.error("[public/features] failed", err);
    return NextResponse.json({ ok: false, flags: {} }, { status: 200 });
  }
}
