/**
 * AAA2 (ZZ4): 사건 지연 감지 daily cron.
 *
 * GET /api/cron/case-delay-scan
 *
 * 최근 6개월 CLOSED 사건들의 matterType별 평균 처리기간 계산.
 * 현재 OPEN 사건 중 matterType 평균 대비 +50% 초과한 사건 → 텔레그램 알림.
 *
 * Feature flag: `case_delay_detection`
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { CaseMatterStatus } from "@generated/prisma-client/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const DELAY_THRESHOLD = 1.5; // 평균 대비 배수
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const OPEN_STATUSES: CaseMatterStatus[] = [
  CaseMatterStatus.INTAKE_REVIEW,
  CaseMatterStatus.CONSULTING,
  CaseMatterStatus.QUOTED,
  CaseMatterStatus.CONTRACT_PENDING,
  CaseMatterStatus.OPEN,
  CaseMatterStatus.DOCUMENT_COLLECTING,
  CaseMatterStatus.DOCUMENT_REVIEWING,
  CaseMatterStatus.READY_TO_SUBMIT,
  CaseMatterStatus.SUBMITTED,
  CaseMatterStatus.SUPPLEMENT_REQUESTED,
  CaseMatterStatus.WAITING_AGENCY,
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("case_delay_detection"))) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }

  try {
    const sixMonthsAgo = new Date(Date.now() - SIX_MONTHS_MS);

    // 1. matterType별 평균 처리 기간 (CLOSED 사건 최근 6개월)
    const closed = await prisma.caseMatter.findMany({
      where: {
        status: "CLOSED",
        closedAt: { not: null, gte: sixMonthsAgo },
        openedAt: { not: null },
      },
      select: { matterType: true, openedAt: true, closedAt: true },
      take: 500,
    });

    const avgByType = new Map<string, { total: number; count: number }>();
    for (const c of closed) {
      if (!c.openedAt || !c.closedAt) continue;
      const days = (c.closedAt.getTime() - c.openedAt.getTime()) / (1000 * 60 * 60 * 24);
      const bucket = avgByType.get(c.matterType) ?? { total: 0, count: 0 };
      bucket.total += days;
      bucket.count += 1;
      avgByType.set(c.matterType, bucket);
    }

    const avgDaysByType = new Map<string, number>();
    for (const [type, { total, count }] of avgByType) {
      if (count >= 2) avgDaysByType.set(type, total / count);
    }

    // 2. 현재 OPEN 사건 중 지연 감지
    const openCases = await prisma.caseMatter.findMany({
      where: {
        status: { in: OPEN_STATUSES },
        openedAt: { not: null },
      },
      select: {
        id: true,
        caseNo: true,
        title: true,
        matterType: true,
        openedAt: true,
        assignedTo: true,
      },
      take: 300,
    });

    const now = Date.now();
    const delayed: Array<{ id: string; title: string; caseNo: string | null; ageDays: number; avgDays: number; ratio: number }> = [];

    for (const c of openCases) {
      if (!c.openedAt) continue;
      const avg = avgDaysByType.get(c.matterType);
      if (!avg) continue;
      const ageDays = (now - c.openedAt.getTime()) / (1000 * 60 * 60 * 24);
      const ratio = ageDays / avg;
      if (ratio >= DELAY_THRESHOLD) {
        delayed.push({
          id: c.id,
          title: c.title,
          caseNo: c.caseNo,
          ageDays: Math.round(ageDays),
          avgDays: Math.round(avg),
          ratio: Math.round(ratio * 100) / 100,
        });
      }
    }

    delayed.sort((a, b) => b.ratio - a.ratio);
    const top = delayed.slice(0, 10);

    if (top.length > 0) {
      const lines = top.map(
        (d) => `• ${d.caseNo || d.id.slice(0, 8)} ${d.title.slice(0, 24)} — ${d.ageDays}일 (평균 ${d.avgDays}일, ${d.ratio}x)`,
      );
      await sendTelegramAlert({
        kind: "system",
        title: `⚠️ 지연 사건 ${top.length}건 (총 ${delayed.length})`,
        lines,
        url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/cases` : undefined,
      }).catch((err) => logger.warn("[case-delay-scan] telegram failed", err));
    }

    logger.info("[case-delay-scan] done", { delayed: delayed.length, avgTypes: avgDaysByType.size });
    return NextResponse.json({
      ok: true,
      delayed: delayed.length,
      avgTypes: avgDaysByType.size,
      top: top.map((d) => ({ caseNo: d.caseNo, ratio: d.ratio })),
    });
  } catch (err) {
    logger.error("[case-delay-scan] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
