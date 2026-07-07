import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  batchVerifyPrecedentsInText,
  clearPrecedentCache,
  getCacheStats,
  getRecentFailures,
  verifyPrecedentLive,
} from "@/lib/services/precedent-live-verifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [stats, failures] = await Promise.all([getCacheStats(), getRecentFailures()]);
  return NextResponse.json({ ok: true, stats, failures });
}

export async function POST(req: Request) {
  const enabled = await isFeatureEnabled("precedent_live_verify");
  if (!enabled) {
    return NextResponse.json({ ok: false, error: "precedent_live_verify 비활성화" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as
    | { text?: string; caseNo?: string; skipCache?: boolean }
    | null;
  if (body?.caseNo) {
    const r = await verifyPrecedentLive(body.caseNo, { skipCache: body.skipCache });
    return NextResponse.json({ ok: true, results: [r] });
  }
  if (body?.text) {
    const results = await batchVerifyPrecedentsInText(body.text, { skipCache: body.skipCache });
    return NextResponse.json({ ok: true, results });
  }
  return NextResponse.json({ ok: false, error: "text 또는 caseNo 필요" }, { status: 400 });
}

export async function DELETE() {
  await clearPrecedentCache();
  return NextResponse.json({ ok: true, cleared: true });
}
