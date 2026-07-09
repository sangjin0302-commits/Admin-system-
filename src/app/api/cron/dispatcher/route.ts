import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron Dispatcher — single endpoint that replaces 40 individual Vercel crons.
 *
 * When `cron_dispatcher_mode` flag is enabled, this route checks the current
 * KST time against SCHEDULE and fires matching jobs via internal fetch.
 *
 * Vercel cron: "0 * * * *" (every hour) — but currently NOT in vercel.json.
 * Enable the flag + add the single cron entry when ready to migrate.
 */

type ScheduleEntry = {
  cronPath: string;
  /** Hour in KST (0-23). Use -1 for "every hour". */
  hour: number;
  /** Minute (0-59). */
  minute: number;
  /** Day of week (0=Sun..6=Sat). undefined = every day. */
  dayOfWeek?: number;
  /** Day of month (1-31). undefined = every day. */
  dayOfMonth?: number;
};

/**
 * Schedule map derived from vercel.json crons.
 * All times are KST (UTC+9). Vercel cron schedules are in UTC,
 * so these are converted: e.g. "0 0 * * *" UTC = 09:00 KST.
 */
const SCHEDULE: ScheduleEntry[] = [
  // Daily
  { cronPath: "/api/cron/deadline-scan", hour: 9, minute: 0 },
  { cronPath: "/api/cron/google-calendar-sync", hour: 15, minute: 0 },
  { cronPath: "/api/cron/lawbot-batch-analyze", hour: 11, minute: 0 },
  { cronPath: "/api/cron/auto-conversion-proposals", hour: 12, minute: 0 },
  { cronPath: "/api/cron/naver-rss-sync", hour: 10, minute: 0 },
  { cronPath: "/api/cron/stale-inquiries-alert", hour: 17, minute: 0 },
  { cronPath: "/api/cron/follow-up-reminder", hour: 18, minute: 0 },
  { cronPath: "/api/cron/blog-translate", hour: 13, minute: 0 },
  { cronPath: "/api/cron/intake-retarget", hour: 19, minute: 0 },
  { cronPath: "/api/cron/daily-briefing", hour: 8, minute: 0 },
  { cronPath: "/api/cron/legal-info-daily", hour: 7, minute: 0 },
  { cronPath: "/api/cron/deadline-calendar-sync", hour: 14, minute: 0 },
  { cronPath: "/api/cron/review-request", hour: 19, minute: 0 },
  { cronPath: "/api/cron/priority-scoring", hour: 6, minute: 0 },
  { cronPath: "/api/cron/audio-briefing", hour: 7, minute: 0 },
  { cronPath: "/api/cron/legal-news-fetch", hour: 8, minute: 0 },
  { cronPath: "/api/cron/naver-kin-scan", hour: 10, minute: 0 },
  { cronPath: "/api/cron/deadline-autopilot", hour: 5, minute: 0 },
  { cronPath: "/api/cron/audit-anomaly-scan", hour: 4, minute: 0 },
  { cronPath: "/api/cron/backup-mirror", hour: 12, minute: 0 },
  { cronPath: "/api/cron/queue-worker", hour: 9, minute: 30 },
  { cronPath: "/api/cron/ai-regression-run", hour: 15, minute: 0 },
  { cronPath: "/api/cron/auto-rollback-check", hour: 10, minute: 30 },
  { cronPath: "/api/cron/self-healing-scan", hour: 11, minute: 30 },
  { cronPath: "/api/cron/auto-marketing", hour: 15, minute: 0 },
  { cronPath: "/api/cron/deploy-status-check", hour: 16, minute: 0 },
  { cronPath: "/api/cron/kakao-retry", hour: 17, minute: 0 },
  { cronPath: "/api/cron/daily-kpi-email", hour: 8, minute: 30 },

  // Weekly (Sunday = 0)
  { cronPath: "/api/cron/cleanup", hour: 12, minute: 0, dayOfWeek: 0 },
  { cronPath: "/api/cron/audit-cleanup", hour: 13, minute: 0, dayOfWeek: 0 },
  { cronPath: "/api/cron/weekly-report", hour: 21, minute: 0, dayOfWeek: 0 },
  { cronPath: "/api/cron/nps-survey", hour: 19, minute: 0, dayOfWeek: 0 },
  { cronPath: "/api/cron/ad-optimizer-digest", hour: 10, minute: 0, dayOfWeek: 1 },
  { cronPath: "/api/cron/newsletter-digest", hour: 9, minute: 0, dayOfWeek: 1 },
  { cronPath: "/api/cron/case-delay-scan", hour: 8, minute: 0, dayOfWeek: 1 },
  { cronPath: "/api/cron/ab-auto-promote", hour: 22, minute: 0, dayOfWeek: 0 },
  { cronPath: "/api/cron/podcast-generate", hour: 6, minute: 0, dayOfWeek: 2 },
  { cronPath: "/api/cron/gsc-rank-drop", hour: 7, minute: 30, dayOfWeek: 2 },

  // Monthly (1st)
  { cronPath: "/api/cron/finance-monthly-summary", hour: 10, minute: 0, dayOfMonth: 1 },
  { cronPath: "/api/cron/tax-report-autopilot", hour: 12, minute: 0, dayOfMonth: 1 },
];

function matches(entry: ScheduleEntry, now: Date): boolean {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();

  if (entry.hour !== -1 && entry.hour !== hour) return false;
  // Allow 5-minute window for minute matching
  if (Math.abs(entry.minute - minute) > 5) return false;
  if (entry.dayOfWeek !== undefined && entry.dayOfWeek !== dayOfWeek) return false;
  if (entry.dayOfMonth !== undefined && entry.dayOfMonth !== dayOfMonth) return false;

  return true;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("cron_dispatcher_mode"))) {
    return NextResponse.json({ ok: true, skipped: "cron_dispatcher_mode disabled" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  // Use KST for schedule matching
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const matched = SCHEDULE.filter((e) => matches(e, now));

  if (matched.length === 0) {
    return NextResponse.json({ ok: true, matched: 0, hour: now.getHours(), minute: now.getMinutes() });
  }

  const results: Array<{ path: string; status: number; ok: boolean }> = [];

  for (const entry of matched) {
    try {
      const res = await fetch(`${baseUrl}${entry.cronPath}`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      results.push({ path: entry.cronPath, status: res.status, ok: res.ok });
      logger.info(`[cron-dispatcher] ${entry.cronPath} → ${res.status}`);
    } catch (err) {
      logger.error(`[cron-dispatcher] ${entry.cronPath} failed`, err);
      results.push({ path: entry.cronPath, status: 0, ok: false });
    }
  }

  return NextResponse.json({
    ok: true,
    dispatched: results.length,
    hour: now.getHours(),
    minute: now.getMinutes(),
    results,
  });
}
