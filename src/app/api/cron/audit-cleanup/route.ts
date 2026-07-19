/**
 * Vercel Cron — AdminAuditEvent + NotificationLog + CaseAnalysisRun 90일 보존.
 *
 * 매주 일요일 04:00 실행. PAYMENT_CANCEL / ROLE_CHANGE 등 중요 액션은 보존
 * 기간을 더 길게 (1년).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STANDARD_RETENTION_DAYS = 90;
const LONG_RETENTION_DAYS = 365;
const LONG_RETAIN_ACTIONS = [
  "PAYMENT_CANCEL",
  "ROLE_CHANGE",
  "DELETE",
  "CONFIG_CHANGE",
] as const;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  // 시크릿이 비어 있으면 예전 코드는 검사 자체를 건너뛰어 누구나 실행할 수 있었다.
  // 미설정이면 무조건 거부한다.
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const stdCutoff = new Date(Date.now() - STANDARD_RETENTION_DAYS * 86400_000);
  const longCutoff = new Date(Date.now() - LONG_RETENTION_DAYS * 86400_000);

  const [auditStd, auditLong, notifs, analyses] = await Promise.all([
    prisma.adminAuditEvent
      .deleteMany({
        where: {
          createdAt: { lt: stdCutoff },
          action: { notIn: LONG_RETAIN_ACTIONS as unknown as Array<"PAYMENT_CANCEL" | "ROLE_CHANGE" | "DELETE" | "CONFIG_CHANGE"> },
        },
      })
      .catch(() => ({ count: 0 })),
    prisma.adminAuditEvent
      .deleteMany({
        where: {
          createdAt: { lt: longCutoff },
          action: { in: [...LONG_RETAIN_ACTIONS] },
        },
      })
      .catch(() => ({ count: 0 })),
    prisma.notificationLog
      .deleteMany({ where: { createdAt: { lt: stdCutoff } } })
      .catch(() => ({ count: 0 })),
    prisma.caseAnalysisRun
      .deleteMany({
        where: {
          createdAt: { lt: stdCutoff },
          status: { in: ["SKIPPED", "FAILED"] },
        },
      })
      .catch(() => ({ count: 0 })),
  ]);

  const result = {
    audit_standard_deleted: auditStd.count,
    audit_long_deleted: auditLong.count,
    notification_deleted: notifs.count,
    analysis_failed_deleted: analyses.count,
  };
  logger.info("[cron:audit-cleanup]", result);
  return NextResponse.json({
    ok: true,
    runAt: new Date().toISOString(),
    ...result,
  });
}
