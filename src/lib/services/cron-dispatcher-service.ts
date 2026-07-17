/**
 * Cron Dispatcher Service
 *
 * 41개 개별 cron → 8개 그룹 배치로 통합.
 * 각 그룹은 소속 태스크를 순차적으로 호출하고 결과를 반환합니다.
 */

import { logger } from "@/lib/utils/logger";

export const CRON_GROUPS: Record<string, string[]> = {
  "morning-ops": [
    "/api/cron/deadline-scan",
    "/api/cron/stale-inquiries-alert",
    "/api/cron/follow-up-reminder",
    "/api/cron/kakao-retry",
    "/api/cron/review-request",
    "/api/cron/intake-retarget",
    "/api/cron/deploy-status-check",
  ],
  "night-analytics": [
    "/api/cron/priority-scoring",
    "/api/cron/audit-anomaly-scan",
    "/api/cron/deadline-autopilot",
    "/api/cron/daily-briefing",
    "/api/cron/daily-kpi-email",
    "/api/cron/audio-briefing",
    "/api/cron/legal-news-fetch",
    "/api/cron/legal-info-daily",
  ],
  "content-sync": [
    "/api/cron/naver-rss-sync",
    "/api/cron/naver-kin-scan",
    "/api/cron/blog-translate",
    "/api/cron/auto-marketing",
  ],
  "infra-maintenance": [
    "/api/cron/backup-mirror",
    "/api/cron/auto-conversion-proposals",
    "/api/cron/queue-worker",
    "/api/cron/ai-regression-run",
    "/api/cron/auto-rollback-check",
    "/api/cron/self-healing-scan",
    "/api/cron/lawbot-batch-analyze",
  ],
  "calendar-sync": [
    "/api/cron/google-calendar-sync",
    "/api/cron/deadline-calendar-sync",
  ],
  "weekly-batch": [
    "/api/cron/weekly-report",
    "/api/cron/cleanup",
    "/api/cron/audit-cleanup",
    "/api/cron/nps-survey",
    "/api/cron/ab-auto-promote",
    "/api/cron/ad-optimizer-digest",
    "/api/cron/newsletter-digest",
    "/api/cron/law-health",
  ],
  "monthly-batch": [
    "/api/cron/finance-monthly-summary",
    "/api/cron/tax-report-autopilot",
  ],
  "bi-weekly": [
    "/api/cron/case-delay-scan",
    "/api/cron/gsc-rank-drop",
    "/api/cron/podcast-generate",
  ],
};

export type CronTaskResult = {
  task: string;
  status: number;
  duration: number;
  error?: string;
};

export async function runCronGroup(
  group: string,
  baseUrl: string,
  cronSecret: string,
): Promise<{ group: string; results: CronTaskResult[] }> {
  const tasks = CRON_GROUPS[group];
  if (!tasks) {
    throw new Error(`Unknown cron group: ${group}`);
  }

  const results: CronTaskResult[] = [];

  for (const task of tasks) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}${task}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
      });
      results.push({
        task,
        status: res.status,
        duration: Date.now() - start,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[cron-dispatcher] ${group}/${task} failed: ${message}`);
      results.push({
        task,
        status: 500,
        duration: Date.now() - start,
        error: message,
      });
    }
  }

  return { group, results };
}

export function getCronGroups(): { name: string; taskCount: number }[] {
  return Object.entries(CRON_GROUPS).map(([name, tasks]) => ({
    name,
    taskCount: tasks.length,
  }));
}
