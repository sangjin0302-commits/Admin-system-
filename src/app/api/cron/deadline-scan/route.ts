/**
 * Vercel Cron — 매일 자동 기한 점검
 * vercel.json 의 crons 에 등록.
 * Vercel은 Authorization: Bearer <CRON_SECRET> 헤더를 보내므로 검증.
 */

import { NextResponse } from "next/server";

import { scanAndCreateDeadlineAlerts } from "@/lib/services/deadline-alert-generator";
import { notifyDeadlineReminder } from "@/lib/services/kakao-notification-service";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export async function GET(request: Request) {
  // 인증 — Vercel Cron은 Bearer <CRON_SECRET>
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected) {
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await scanAndCreateDeadlineAlerts({ warnDays: 14 });

    // 알림톡 클로즈드 루프 — D-3 사건/작업 의뢰인에게 자동 발송
    const reminderCount = await sendD3Reminders();

    logger.debug("[cron:deadline-scan]", { ...result, reminderCount });
    return NextResponse.json({
      ok: true,
      runAt: new Date().toISOString(),
      ...result,
      reminderCount,
    });
  } catch (error) {
    logger.error("[cron:deadline-scan] failed", error);
    return NextResponse.json({ ok: false, error: "scan failed" }, { status: 500 });
  }
}

/**
 * D-3 알림: 향후 3일 이내 만료되는 사건 dueDate / 작업 dueDate에 대해
 * 의뢰인(첫 번째 CaseParty.phone)에게 1회만 발송.
 *
 * 중복 발송 방지 — 같은 (caseId, 날짜)로 24h 내 발송 기록이 있으면 skip.
 */
async function sendD3Reminders(): Promise<number> {
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const cases = await prisma.caseMatter.findMany({
    where: {
      dueDate: { gte: now, lte: in3Days },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      parties: { select: { phone: true }, take: 1 },
    },
    take: 200,
  });

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  let sent = 0;
  for (const c of cases) {
    const phone = c.parties[0]?.phone;
    if (!phone || !c.dueDate) continue;

    const recent = await prisma.notificationLog
      .findFirst({
        where: {
          caseId: c.id,
          channel: "ALIMTALK",
          status: "SENT",
          createdAt: { gte: yesterday },
        },
        select: { id: true },
      })
      .catch(() => null);
    if (recent) continue;

    const ok = await notifyDeadlineReminder(
      phone,
      c.title,
      c.dueDate.toISOString().slice(0, 10),
      c.id
    );
    if (ok) sent++;
  }
  return sent;
}
