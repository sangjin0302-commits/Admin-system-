import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_ATTEMPTS = 3;
const SETTING_KEY = "kakao.retry.queue";

type FailedEntry = {
  logId: string;
  recipient: string;
  templateId?: string;
  variables?: string;
  attempts: number;
  lastAttempt: string;
};

/**
 * 매일 08:00 KST. 카카오 알림톡 발송 실패 자동 재시도 (최대 3회).
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("kakao_retry_auto"))) {
    return NextResponse.json({ ok: true, skipped: "flag-off" });
  }

  // Find ALIMTALK failures from last 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failedLogs = await prisma.notificationLog.findMany({
    where: {
      channel: "ALIMTALK",
      status: "FAILED",
      createdAt: { gte: cutoff },
    },
    take: 50,
  }).catch(() => []);

  // Load existing retry queue from SiteSetting
  let queue: FailedEntry[] = [];
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    if (row?.value) queue = JSON.parse(row.value) as FailedEntry[];
  } catch { /* empty */ }

  // Merge new failures into queue
  const existingIds = new Set(queue.map((e) => e.logId));
  for (const log of failedLogs) {
    if (!existingIds.has(log.id)) {
      queue.push({
        logId: log.id,
        recipient: log.recipient,
        templateId: log.templateId ?? undefined,
        variables: log.variables ?? undefined,
        attempts: 0,
        lastAttempt: new Date().toISOString(),
      });
    }
  }

  // Retry entries with attempts < MAX_ATTEMPTS
  let retried = 0;
  let succeeded = 0;
  const remaining: FailedEntry[] = [];

  for (const entry of queue) {
    if (entry.attempts >= MAX_ATTEMPTS) continue; // drop exhausted

    entry.attempts += 1;
    entry.lastAttempt = new Date().toISOString();

    try {
      // Re-queue as QUEUED so normal send pipeline picks it up
      await prisma.notificationLog.update({
        where: { id: entry.logId },
        data: { status: "QUEUED", errorMessage: null },
      });
      retried++;
      succeeded++;
    } catch {
      // Still failed, keep in queue for next run
      remaining.push(entry);
    }
  }

  // Persist remaining queue
  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(remaining) },
    update: { value: JSON.stringify(remaining) },
  });

  logger.info("[cron/kakao-retry]", { failedLogs: failedLogs.length, retried, succeeded, remaining: remaining.length });
  return NextResponse.json({ ok: true, retried, succeeded, remaining: remaining.length });
}
