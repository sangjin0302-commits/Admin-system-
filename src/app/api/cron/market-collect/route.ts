/**
 * 시장 데이터 수집 cron — cron-dispatcher "content-sync" 그룹에서 호출됩니다.
 * (vercel.json 개별 등록 없음 — Hobby cron 한도 때문에 배치 디스패처가 매일 대신 실행)
 *
 * AI 호출 없음 — 수집·분류·집계만 수행합니다 (AI 리포트는 버튼 클릭 시에만).
 */

import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  collectMarket,
  collectTrends,
  rebuildCompetitorProfiles,
} from "@/lib/services/market-collect-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const enabled = await isFeatureEnabled("market_collect");
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature disabled" });
  }

  try {
    const collected = await collectMarket();
    const competitors = await rebuildCompetitorProfiles();
    const trends = await collectTrends();
    logger.debug("[cron:market-collect]", { collected, competitors, trends });
    return NextResponse.json({ ok: true, collected, competitors, trends });
  } catch (err) {
    logger.error("[cron:market-collect] 실패", err);
    return NextResponse.json({ ok: false, error: "collect failed" }, { status: 500 });
  }
}
