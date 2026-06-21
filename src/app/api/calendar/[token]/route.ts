import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma/client";
import { exportToICS, type CalendarEvent } from "@/lib/services/calendar-integration-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 공개 iCal 피드 — Google Calendar / Outlook / Apple Calendar 구독용.
 *
 * URL: /api/calendar/<CALENDAR_FEED_TOKEN>.ics
 * 토큰 설정: 환경변수 CALENDAR_FEED_TOKEN (최소 24자).
 *   미설정 시 404 반환.
 *
 * 포함 항목:
 *   - CaseMatter.dueDate         (사건 마감일)
 *   - CaseMatter.nextActionAt    (다음 액션)
 *   - CaseTask.dueDate           (작업 기한)
 */

function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await context.params;
  const expected = process.env.CALENDAR_FEED_TOKEN?.trim();
  if (!expected || expected.length < 24) {
    return new NextResponse("Not found", { status: 404 });
  }

  const token = rawToken.replace(/\.ics$/i, "");
  if (!safeEq(token, expected)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const now = new Date();
  const from = new Date(now.getTime() - 30 * 86400_000);
  const to = new Date(now.getTime() + 180 * 86400_000);

  const [cases, tasks] = await Promise.all([
    prisma.caseMatter.findMany({
      where: {
        OR: [
          { dueDate: { gte: from, lte: to } },
          { nextActionAt: { gte: from, lte: to } },
        ],
      },
      select: { id: true, caseNo: true, title: true, dueDate: true, nextActionAt: true },
      take: 500,
    }),
    prisma.caseTask.findMany({
      where: { dueDate: { gte: from, lte: to } },
      select: { id: true, title: true, dueDate: true, caseId: true },
      take: 500,
    }),
  ]);

  const events: CalendarEvent[] = [];

  for (const c of cases) {
    if (c.dueDate) {
      events.push({
        id: `case-due-${c.id}`,
        title: `[마감] ${c.caseNo ? `${c.caseNo} · ` : ""}${c.title}`,
        start: c.dueDate,
        end: new Date(c.dueDate.getTime() + 60 * 60_000),
        description: `Case ID: ${c.id}`,
        caseId: c.id,
        reminderMinutes: 60 * 24,
      });
    }
    if (c.nextActionAt) {
      events.push({
        id: `case-next-${c.id}`,
        title: `[다음 액션] ${c.title}`,
        start: c.nextActionAt,
        end: new Date(c.nextActionAt.getTime() + 30 * 60_000),
        caseId: c.id,
        reminderMinutes: 30,
      });
    }
  }
  for (const t of tasks) {
    if (!t.dueDate) continue;
    events.push({
      id: `task-${t.id}`,
      title: `[작업] ${t.title}`,
      start: t.dueDate,
      end: new Date(t.dueDate.getTime() + 30 * 60_000),
      caseId: t.caseId ?? undefined,
      reminderMinutes: 30,
    });
  }

  const ics = exportToICS(events);
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Content-Disposition": 'inline; filename="ethos-calendar.ics"',
    },
  });
}
