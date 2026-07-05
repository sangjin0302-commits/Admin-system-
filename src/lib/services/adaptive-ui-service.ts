/**
 * 적응형 UI 서비스 — 관리자 사용 패턴을 추적하여 자주 쓰는 페이지 바로가기 및 재배치 제안.
 *
 * 저장: SiteSetting key = "ui.usage.stats" (JSON)
 */

import { prisma } from "@/lib/prisma/client";

const STATS_KEY = "ui.usage.stats";
const NAV_OVERRIDE_KEY = "ui.nav.order";
const MAX_EVENTS_PER_USER = 500;

export type UsageEvent = {
  at: string;
  type: "page" | "click";
  target: string; // e.g. "/admin/inquiries" or "btn.export"
  hour: number; // 0-23
};

export type UsageStats = {
  users: Record<string, UsageEvent[]>;
};

export type Shortcut = {
  target: string;
  count: number;
  label: string;
};

export type ReorgSuggestion = {
  currentOrder: string[];
  suggestedOrder: string[];
  rationale: string;
};

function inferLabel(target: string): string {
  if (target.startsWith("/admin/")) {
    return target.replace(/^\/admin\//, "").replace(/[-_/]/g, " ").trim() || "대시보드";
  }
  return target;
}

async function loadStats(): Promise<UsageStats> {
  const row = await prisma.siteSetting.findUnique({ where: { key: STATS_KEY } }).catch(() => null);
  if (!row) return { users: {} };
  try {
    const parsed = JSON.parse(row.value) as UsageStats;
    return parsed?.users ? parsed : { users: {} };
  } catch {
    return { users: {} };
  }
}

async function saveStats(stats: UsageStats): Promise<void> {
  await prisma.siteSetting
    .upsert({
      where: { key: STATS_KEY },
      create: { key: STATS_KEY, value: JSON.stringify(stats) },
      update: { value: JSON.stringify(stats) },
    })
    .catch(() => null);
}

export async function trackEvent(
  userId: string,
  event: { type: "page" | "click"; target: string }
): Promise<void> {
  if (!userId || !event.target) return;
  const stats = await loadStats();
  const now = new Date();
  const list = stats.users[userId] ?? [];
  list.push({
    at: now.toISOString(),
    type: event.type,
    target: event.target,
    hour: now.getHours(),
  });
  const trimmed = list.slice(-MAX_EVENTS_PER_USER);
  stats.users[userId] = trimmed;
  await saveStats(stats);
}

export async function getPersonalizedShortcuts(userId: string, limit = 5): Promise<Shortcut[]> {
  const stats = await loadStats();
  const events = stats.users[userId] ?? [];
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.type !== "page") continue;
    counts.set(e.target, (counts.get(e.target) ?? 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
  return sorted.map(([target, count]) => ({ target, count, label: inferLabel(target) }));
}

export async function suggestReorg(userId?: string): Promise<ReorgSuggestion> {
  const stats = await loadStats();
  const counts = new Map<string, number>();
  const targetUsers = userId ? [userId] : Object.keys(stats.users);
  for (const uid of targetUsers) {
    const events = stats.users[uid] ?? [];
    for (const e of events) {
      if (e.type !== "page") continue;
      counts.set(e.target, (counts.get(e.target) ?? 0) + 1);
    }
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const suggested = sorted.map(([t]) => t);

  const currentRow = await prisma.siteSetting
    .findUnique({ where: { key: NAV_OVERRIDE_KEY } })
    .catch(() => null);
  let current: string[] = [];
  if (currentRow) {
    try {
      current = JSON.parse(currentRow.value) as string[];
      if (!Array.isArray(current)) current = [];
    } catch {
      current = [];
    }
  }

  return {
    currentOrder: current,
    suggestedOrder: suggested.slice(0, 20),
    rationale: `최근 사용 통계 기반 상위 ${Math.min(suggested.length, 20)}개 페이지 정렬 제안`,
  };
}

export async function applyReorg(order: string[]): Promise<void> {
  await prisma.siteSetting
    .upsert({
      where: { key: NAV_OVERRIDE_KEY },
      create: { key: NAV_OVERRIDE_KEY, value: JSON.stringify(order) },
      update: { value: JSON.stringify(order) },
    })
    .catch(() => null);
}

export async function getGlobalUsageStats(): Promise<{
  totalEvents: number;
  uniqueUsers: number;
  topPages: Shortcut[];
  hourDistribution: Record<number, number>;
}> {
  const stats = await loadStats();
  const users = Object.keys(stats.users);
  let total = 0;
  const pageCounts = new Map<string, number>();
  const hourDist: Record<number, number> = {};
  for (const uid of users) {
    const events = stats.users[uid] ?? [];
    total += events.length;
    for (const e of events) {
      if (e.type === "page") {
        pageCounts.set(e.target, (pageCounts.get(e.target) ?? 0) + 1);
      }
      hourDist[e.hour] = (hourDist[e.hour] ?? 0) + 1;
    }
  }
  const topPages = Array.from(pageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([target, count]) => ({ target, count, label: inferLabel(target) }));
  return {
    totalEvents: total,
    uniqueUsers: users.length,
    topPages,
    hourDistribution: hourDist,
  };
}
