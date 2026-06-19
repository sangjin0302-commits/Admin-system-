import { prisma } from "@/lib/prisma/client";

export type ScheduledJob = {
  id: string;
  name: string;
  cron: string;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
  handler: () => Promise<void>;
};

const registry = new Map<string, ScheduledJob>();

export function registerJob(job: ScheduledJob): void {
  registry.set(job.id, job);
}

export function getJobs(): ScheduledJob[] {
  return Array.from(registry.values());
}

export async function runJob(
  id: string
): Promise<{ success: boolean; error?: string; durationMs: number }> {
  const job = registry.get(id);
  const start = Date.now();
  if (!job) {
    return { success: false, error: `Job not found: ${id}`, durationMs: 0 };
  }
  if (!job.enabled) {
    return { success: false, error: "Job disabled", durationMs: 0 };
  }
  try {
    await job.handler();
    job.lastRun = new Date();
    registry.set(id, job);
    return { success: true, durationMs: Date.now() - start };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - start,
    };
  }
}

// ---- Default jobs ----

async function expiredCasesCheckHandler() {
  const now = new Date();
  const expired = await prisma.caseMatter.findMany({
    where: {
      dueDate: { lt: now },
      status: { notIn: ["CLOSED", "CANCELLED"] },
    },
    select: { id: true, title: true, dueDate: true },
    take: 100,
  });
  console.log(
    `[job:expired-cases-check] Found ${expired.length} expired open cases`
  );
}

async function weeklySummaryHandler() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [newInquiries, newCases] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.caseMatter.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);
  console.log(
    `[job:weekly-summary] last 7d — inquiries=${newInquiries} cases=${newCases}`
  );
}

async function staleInquiryAlertHandler() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const stale = await prisma.inquiry.count({
    where: {
      status: {
        in: ["NEW", "PRE_DIAGNOSED", "CONSULTATION_REQUIRED", "QUOTE_PENDING", "IN_REVIEW"],
      },
      updatedAt: { lt: cutoff },
    },
  });
  console.log(`[job:stale-inquiry-alert] ${stale} stale inquiries (>7d)`);
}

registerJob({
  id: "expired-cases-check",
  name: "만료 사건 점검",
  cron: "0 9 * * *",
  enabled: true,
  handler: expiredCasesCheckHandler,
});

registerJob({
  id: "weekly-summary",
  name: "주간 요약",
  cron: "0 9 * * 1",
  enabled: true,
  handler: weeklySummaryHandler,
});

registerJob({
  id: "stale-inquiry-alert",
  name: "지연 문의 알림",
  cron: "0 10 * * *",
  enabled: true,
  handler: staleInquiryAlertHandler,
});
