import { NextResponse } from "next/server";

import { fetchGazetteList, fetchGazetteStats } from "@/lib/services/gazette-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 홈 관보 티저용 경량 API — 최신 3건 + 통계.
 * 봇 fetch 를 서버에서 처리하고, 홈은 클라이언트에서 이걸 비동기로 불러
 * 봇 지연/실패가 홈 렌더를 막지 않게 한다. 실패/미설정이면 빈 배열/통계 null.
 */
export async function GET() {
  const [outcome, stats] = await Promise.all([fetchGazetteList(3), fetchGazetteStats()]);
  const items = outcome.status === "ok" ? outcome.items.slice(0, 3) : [];
  return NextResponse.json(
    { items, stats },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } }
  );
}
