import { NextResponse } from "next/server";

import { getTopSearchQueries } from "@/lib/services/gsc-service";
import { getExtraKeywordLandings } from "@/lib/services/keyword-landing-service";
import { BASE_KEYWORD_LANDINGS } from "@/lib/constants/keyword-landings";
import {
  aggregateLandingPerformance,
  pickLandingCleanupCandidates,
} from "@/lib/services/landing-performance";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 주간 랜딩 정리 리포트 — DB 로 생성한 /keyword 랜딩 중 30일↑ 노출 적음·클릭 0
 * (죽은 랜딩) 후보를 텔레그램으로 알린다. 자동 삭제하지 않고 "제안"만.
 * weekly-batch 그룹에서 GET 호출. flag off 면 skip.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("landing_cleanup_report").catch(() => false))) {
    return NextResponse.json({ ok: true, skipped: "flag_off" });
  }

  const [queries, extras] = await Promise.all([
    getTopSearchQueries(28, 50).catch(() => []),
    getExtraKeywordLandings().catch(() => []),
  ]);

  if (extras.length === 0) {
    return NextResponse.json({ ok: true, candidates: 0, note: "no_db_landings" });
  }

  const landings = [
    ...BASE_KEYWORD_LANDINGS.map((k) => ({ term: k.term, label: k.label, tokens: k.tokens })),
    ...extras.map((e) => ({ term: e.slug, label: e.label, tokens: e.tokens })),
  ];
  const perf = aggregateLandingPerformance(
    landings,
    queries.map((q) => ({ query: q.query, clicks: q.clicks, impressions: q.impressions }))
  );
  const nowMs = Date.now();
  const createdAtBySlug = new Map(extras.map((e) => [e.slug, Date.parse(e.createdAt) || nowMs]));
  const candidates = pickLandingCleanupCandidates(perf, createdAtBySlug, nowMs);

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, candidates: 0 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  await sendTelegramAlert({
    kind: "system",
    title: "랜딩 정리 제안 (30일+ 노출 적음·클릭 0)",
    lines: [
      `삭제 검토 후보 ${candidates.length}건:`,
      ...candidates.slice(0, 15).map((c) => `• ${c.label} (/keyword/${c.term})`),
      "※ 자동 삭제 안 함 — /admin/landing-gaps 에서 확인 후 삭제",
    ],
    url: site ? `${site}/admin/landing-gaps` : undefined,
  });

  logger.info("[cron/landing-cleanup-report] sent", { candidates: candidates.length });
  return NextResponse.json({ ok: true, candidates: candidates.length });
}
