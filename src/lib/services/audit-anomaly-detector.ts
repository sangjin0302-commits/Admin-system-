/**
 * AI 감사 로그 분석 — 관리자 감사 로그 기준선 대비 이상행동 탐지.
 *
 * 소스: CaseEvent where eventType startsWith "admin."  (기존 audit-service 사용 형식)
 *
 * 탐지:
 *   - 비정상 시각 접근 (0시~6시 KST)
 *   - 대량 데이터 내보내기 (`admin.export.*` 또는 `admin.bulk_*` 짧은 시간에 다수)
 *   - 권한 상승 (`admin.role.*`, `admin.permission.*`)
 *   - 실패 로그인 급증 (`admin.login.failed` 짧은 시간에 다수)
 *   - 시간당 액션 수가 기준선(중앙값)의 5배 초과
 *
 * 저장:
 *   - "audit_anomaly.log"    — 최근 이상행동 (최대 200개)
 *   - "audit_anomaly.marks.<id>"  — "정상"/"조사 필요" 마킹
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";

const LOG_KEY = "audit_anomaly.log";
const MARK_PREFIX = "audit_anomaly.marks.";
const MAX_LOG = 200;

export type Severity = "low" | "medium" | "high" | "critical";
export type AnomalyType = "off_hours" | "bulk_export" | "privilege_escalation" | "failed_login_spike" | "rate_spike";

export type Anomaly = {
  id: string;
  type: AnomalyType;
  severity: Severity;
  actor: string;
  action: string;
  timestamp: string;
  deviation: string;
  aiExplanation: string;
  eventIds: string[];
};

export type AnomalyMark = "normal" | "investigate";

export async function getRecentAnomalies(limit = 50): Promise<Anomaly[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } });
    if (!row?.value) return [];
    const arr = JSON.parse(row.value) as Anomaly[];
    return Array.isArray(arr) ? arr.slice(0, limit) : [];
  } catch {
    return [];
  }
}

async function appendAnomalies(items: Anomaly[]): Promise<void> {
  if (items.length === 0) return;
  const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } });
  const arr: Anomaly[] = row?.value ? (JSON.parse(row.value) as Anomaly[]) : [];
  const merged = [...items, ...arr].slice(0, MAX_LOG);
  await prisma.siteSetting.upsert({
    where: { key: LOG_KEY },
    create: { key: LOG_KEY, value: JSON.stringify(merged) },
    update: { value: JSON.stringify(merged) },
  });
}

export async function getMark(anomalyId: string): Promise<AnomalyMark | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: `${MARK_PREFIX}${anomalyId}` } });
  if (!row?.value) return null;
  return row.value === "normal" || row.value === "investigate" ? (row.value as AnomalyMark) : null;
}

export async function setMark(anomalyId: string, mark: AnomalyMark): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: `${MARK_PREFIX}${anomalyId}` },
    create: { key: `${MARK_PREFIX}${anomalyId}`, value: mark },
    update: { value: mark },
  });
}

function severityScore(s: Severity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s];
}

export function sortBySeverity(a: Anomaly, b: Anomaly): number {
  const cmp = severityScore(b.severity) - severityScore(a.severity);
  if (cmp !== 0) return cmp;
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

type EventRow = { id: string; eventType: string; actorId: string | null; actorName: string | null; createdAt: Date };

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function hourKstFromDate(d: Date): number {
  const kstMs = d.getTime() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).getUTCHours();
}

function makeId(prefix: string, evId: string): string {
  return `anom_${prefix}_${evId.slice(-8)}_${Date.now().toString(36)}`;
}

async function aiExplain(context: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "AI 미사용 - 기준선 분석 결과만 제공";
  try {
    const r = await callAnthropicMessages({
      model: "claude-haiku-4-5-20251001",
      maxTokens: 200,
      prompt: `다음 감사 로그 이상 징후를 한국어 1-2문장으로 설명하고 리스크 수준을 코멘트하세요. 사실 기반으로만.
${context}`,
    });
    return r.text.trim() || "AI 응답 없음";
  } catch (err) {
    logger.warn("[audit-anomaly] AI 설명 실패", err);
    return "AI 설명 생성 실패 - 기준선 분석 결과만 제공";
  }
}

/**
 * 최근 N시간 감사 이벤트 스캔 후 이상행동 감지.
 */
export async function runAuditAnomalyScan(): Promise<{ scanned: number; anomalies: number; critical: number }> {
  const now = Date.now();
  const scanSince = new Date(now - 60 * 60 * 1000); // 최근 1시간
  const baselineSince = new Date(now - 14 * 24 * 60 * 60 * 1000); // 14일

  const [recentRows, baselineRows] = await Promise.all([
    prisma.caseEvent.findMany({
      where: { eventType: { startsWith: "admin." }, createdAt: { gte: scanSince } },
      select: { id: true, eventType: true, actorId: true, actorName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    prisma.caseEvent.findMany({
      where: { eventType: { startsWith: "admin." }, createdAt: { gte: baselineSince, lt: scanSince } },
      select: { actorId: true, createdAt: true },
      take: 20000,
    }),
  ]) as [EventRow[], Array<{ actorId: string | null; createdAt: Date }>];

  // Baseline: median actions per admin per hour
  const perActorPerHour = new Map<string, Map<string, number>>();
  for (const r of baselineRows) {
    const actor = r.actorId ?? "unknown";
    const hourKey = `${r.createdAt.getUTCFullYear()}-${r.createdAt.getUTCMonth()}-${r.createdAt.getUTCDate()}-${r.createdAt.getUTCHours()}`;
    if (!perActorPerHour.has(actor)) perActorPerHour.set(actor, new Map());
    const inner = perActorPerHour.get(actor)!;
    inner.set(hourKey, (inner.get(hourKey) ?? 0) + 1);
  }
  const baselineMedianByActor = new Map<string, number>();
  for (const [actor, hours] of perActorPerHour) {
    baselineMedianByActor.set(actor, median(Array.from(hours.values())));
  }

  const anomalies: Anomaly[] = [];

  // Group recent by actor
  const byActor = new Map<string, EventRow[]>();
  for (const r of recentRows) {
    const actor = r.actorId ?? "unknown";
    if (!byActor.has(actor)) byActor.set(actor, []);
    byActor.get(actor)!.push(r);
  }

  for (const [actor, events] of byActor) {
    const baseline = baselineMedianByActor.get(actor) ?? 5;
    // Rate spike
    if (events.length > 0 && events.length > baseline * 5 && events.length >= 10) {
      const first = events[events.length - 1];
      const ctx = `Actor ${first.actorName ?? actor} - 최근 1시간 액션 ${events.length}건 (기준선 중앙값 ${baseline})`;
      anomalies.push({
        id: makeId("rate", first.id),
        type: "rate_spike",
        severity: events.length > baseline * 10 ? "critical" : "high",
        actor: first.actorName ?? actor,
        action: `bulk actions ×${events.length}`,
        timestamp: first.createdAt.toISOString(),
        deviation: `기준선 대비 ${(events.length / Math.max(1, baseline)).toFixed(1)}배`,
        aiExplanation: await aiExplain(ctx),
        eventIds: events.slice(0, 20).map((e) => e.id),
      });
    }

    // Off-hours access
    const offHours = events.filter((e) => {
      const h = hourKstFromDate(e.createdAt);
      return h >= 0 && h < 6;
    });
    if (offHours.length >= 3) {
      const first = offHours[0];
      const ctx = `Actor ${first.actorName ?? actor} - 새벽 시간대(0-6시 KST) 액션 ${offHours.length}건`;
      anomalies.push({
        id: makeId("off", first.id),
        type: "off_hours",
        severity: offHours.length >= 10 ? "high" : "medium",
        actor: first.actorName ?? actor,
        action: `off-hours ${offHours[0].eventType}`,
        timestamp: first.createdAt.toISOString(),
        deviation: `0-6시 KST ${offHours.length}건`,
        aiExplanation: await aiExplain(ctx),
        eventIds: offHours.slice(0, 20).map((e) => e.id),
      });
    }

    // Bulk export
    const bulk = events.filter((e) => /\.export\.|\.bulk_/i.test(e.eventType));
    if (bulk.length >= 3) {
      const first = bulk[0];
      const ctx = `Actor ${first.actorName ?? actor} - 대량 export/bulk 액션 ${bulk.length}건`;
      anomalies.push({
        id: makeId("bulk", first.id),
        type: "bulk_export",
        severity: bulk.length >= 10 ? "critical" : "high",
        actor: first.actorName ?? actor,
        action: `bulk export ${bulk.length}`,
        timestamp: first.createdAt.toISOString(),
        deviation: `${bulk.length}건 짧은 시간`,
        aiExplanation: await aiExplain(ctx),
        eventIds: bulk.slice(0, 20).map((e) => e.id),
      });
    }

    // Privilege escalation
    const priv = events.filter((e) => /\.role\.|\.permission\.|\.rbac\./i.test(e.eventType));
    if (priv.length >= 1) {
      const first = priv[0];
      const ctx = `Actor ${first.actorName ?? actor} - 권한/역할 변경 ${priv.length}건`;
      anomalies.push({
        id: makeId("priv", first.id),
        type: "privilege_escalation",
        severity: "high",
        actor: first.actorName ?? actor,
        action: first.eventType,
        timestamp: first.createdAt.toISOString(),
        deviation: `${priv.length}건 권한 변경`,
        aiExplanation: await aiExplain(ctx),
        eventIds: priv.slice(0, 20).map((e) => e.id),
      });
    }

    // Failed login spike
    const failed = events.filter((e) => /login\.failed|auth\.failed/i.test(e.eventType));
    if (failed.length >= 5) {
      const first = failed[0];
      const ctx = `Actor ${first.actorName ?? actor} - 실패 로그인 ${failed.length}건`;
      anomalies.push({
        id: makeId("fail", first.id),
        type: "failed_login_spike",
        severity: failed.length >= 20 ? "critical" : "high",
        actor: first.actorName ?? actor,
        action: "login.failed",
        timestamp: first.createdAt.toISOString(),
        deviation: `${failed.length}회 실패`,
        aiExplanation: await aiExplain(ctx),
        eventIds: failed.slice(0, 20).map((e) => e.id),
      });
    }
  }

  await appendAnomalies(anomalies);

  // Telegram alert on critical
  const critical = anomalies.filter((a) => a.severity === "critical");
  if (critical.length > 0) {
    try {
      const mod = await import("@/lib/services/telegram-notify").catch(() => null);
      const send = mod as unknown as { notifyAdmin?: (msg: string) => Promise<unknown> } | null;
      if (send?.notifyAdmin) {
        await send.notifyAdmin(`[감사 이상행동] critical ${critical.length}건 감지: ${critical.map((a) => a.type).join(", ")}`);
      }
    } catch (err) {
      logger.warn("[audit-anomaly] telegram 알림 실패", err);
    }
  }

  return { scanned: recentRows.length, anomalies: anomalies.length, critical: critical.length };
}
