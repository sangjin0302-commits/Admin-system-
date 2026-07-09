/**
 * DDD2: GSC 검색 순위 급락 감지 (주 1회).
 *
 * 최근 7일 vs 직전 7일 평균 position 비교.
 * 노출 50+ 쿼리 중 position이 5계단 이상 하락 → 텔레그램 알림.
 *
 * Feature flag: `gsc_rank_drop_alert`
 */

import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getSearchQueriesRange } from "@/lib/services/gsc-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const DROP_THRESHOLD = 5; // position 5계단 하락
const MIN_IMPRESSIONS = 50;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("gsc_rank_drop_alert"))) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }

  try {
    const [recent, previous] = await Promise.all([
      getSearchQueriesRange(7, 0, 100),
      getSearchQueriesRange(14, 7, 100),
    ]);

    if (recent.length === 0 || previous.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: "gsc_not_configured_or_empty" });
    }

    const prevMap = new Map(previous.map((q) => [q.query, q]));
    const drops: Array<{ query: string; before: number; after: number; impressions: number }> = [];

    for (const q of recent) {
      if (q.impressions < MIN_IMPRESSIONS) continue;
      const prev = prevMap.get(q.query);
      if (!prev) continue;
      const drop = q.position - prev.position; // position 증가 = 하락
      if (drop >= DROP_THRESHOLD) {
        drops.push({ query: q.query, before: prev.position, after: q.position, impressions: q.impressions });
      }
    }

    drops.sort((a, b) => (b.after - b.before) - (a.after - a.before));
    const top = drops.slice(0, 8);

    if (top.length > 0) {
      await sendTelegramAlert({
        kind: "system",
        title: `📉 검색순위 급락 ${top.length}건 (5계단+)`,
        lines: top.map((d) => `• "${d.query}" ${d.before} → ${d.after}위 (노출 ${d.impressions})`),
        url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/insights` : undefined,
      }).catch((err) => logger.warn("[gsc-rank-drop] telegram failed", err));
    }

    logger.info("[cron/gsc-rank-drop] done", { compared: recent.length, drops: drops.length });
    return NextResponse.json({ ok: true, compared: recent.length, drops: drops.length });
  } catch (err) {
    logger.error("[cron/gsc-rank-drop] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
