import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { searchPrecedents } from "@/lib/services/precedent-database-service";
import {
  searchByMeaning,
  rebuildIndex,
  getIndexStatus,
} from "@/lib/services/precedent-vector-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const topK = Math.min(50, Math.max(1, Number(url.searchParams.get("topK") ?? 10)));

  const enabled = await isFeatureEnabled("vector_search");
  if (!enabled) {
    // 우아한 강등 — 키워드 검색으로
    const list = await searchPrecedents(q);
    return NextResponse.json({
      ok: true,
      mode: "keyword-fallback",
      degraded: true,
      results: list.slice(0, topK).map((p) => ({ precedent: p, score: 0 })),
      status: getIndexStatus(),
    });
  }

  if (!q) {
    return NextResponse.json({ ok: true, results: [], status: getIndexStatus() });
  }

  const results = await searchByMeaning(q, topK);
  return NextResponse.json({
    ok: true,
    mode: "vector",
    results,
    status: getIndexStatus(),
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  if (body?.action === "rebuild") {
    const enabled = await isFeatureEnabled("vector_search");
    if (!enabled) {
      return NextResponse.json({ ok: false, error: "vector_search 비활성화" }, { status: 400 });
    }
    const res = await rebuildIndex();
    return NextResponse.json(res);
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
