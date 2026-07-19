import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { syncDeadlineToCalendar, isCalendarSyncConfigured } from "@/lib/services/calendar-sync-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 매일 마감(dueDate)이 향후 30일 이내인 사건 중 아직 동기되지 않은 항목을 Google Calendar에 동기.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  // 시크릿이 비어 있으면 예전 코드는 검사 자체를 건너뛰어 누구나 실행할 수 있었다.
  // 미설정이면 무조건 거부한다.
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isCalendarSyncConfigured()) {
    return NextResponse.json({
      ok: false,
      skipped: true,
      reason: "GOOGLE_CALENDAR_ID / GOOGLE_SERVICE_ACCOUNT_JSON 미설정",
    });
  }

  const runAt = new Date();
  const horizon = new Date(runAt.getTime() + 30 * 86400_000);
  const stats = { checked: 0, synced: 0, alreadySynced: 0, errors: 0 };

  try {
    const cases = await prisma.caseMatter.findMany({
      where: { dueDate: { gte: runAt, lte: horizon } },
      select: { id: true, caseNo: true, title: true, dueDate: true },
      take: 500,
    });
    stats.checked = cases.length;

    for (const c of cases) {
      if (!c.dueDate) continue;
      const existing = await prisma.googleCalendarSyncMap
        .findUnique({
          where: { internalKind_internalId: { internalKind: "case_due", internalId: c.id } },
        })
        .catch(() => null);
      if (existing) {
        stats.alreadySynced++;
        continue;
      }
      const r = await syncDeadlineToCalendar(c.id, {
        title: `[마감] ${c.caseNo ? `${c.caseNo} · ` : ""}${c.title}`,
        date: c.dueDate,
        description: `Case ID: ${c.id}`,
      });
      if (r.provider === "google" && r.eventId) {
        await prisma.googleCalendarSyncMap
          .create({
            data: {
              internalKind: "case_due",
              internalId: c.id,
              googleEventId: r.eventId,
              calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
            },
          })
          .catch(() => undefined);
        stats.synced++;
      } else {
        stats.errors++;
      }
    }
    logger.info("[cron:deadline-calendar-sync]", stats);
    return NextResponse.json({ ok: true, runAt: runAt.toISOString(), ...stats });
  } catch (error) {
    logger.error("[cron:deadline-calendar-sync] failed", error);
    return NextResponse.json({ ok: false, error: "sync failed", stats }, { status: 500 });
  }
}
