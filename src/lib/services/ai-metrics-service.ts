/**
 * AI 모델 성능 메트릭 수집.
 *
 * - 모델·함수별 호출 통계 (input/output tokens, latency, cost, success) 를 시간당 버킷으로 누적.
 * - SiteSetting `ai.metrics.hourly` 에 마지막 168시간(7일) 유지.
 * - 대시보드용 집계 함수 제공 (per function / per model / per day).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const STORE_KEY = "ai.metrics.hourly";
const MAX_HOURS = 168;

export type AIMetricEvent = {
  timestamp: string;
  function: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  success: boolean;
};

// 시간당 버킷 (YYYY-MM-DDTHH)
export type HourlyBucket = {
  hour: string; // ISO hour prefix
  byFunction: Record<
    string,
    Record<
      string, // model
      {
        calls: number;
        errors: number;
        inputTokens: number;
        outputTokens: number;
        latencyMsSum: number;
        costUsd: number;
      }
    >
  >;
};

function hourKey(d: Date): string {
  const iso = d.toISOString();
  return iso.slice(0, 13); // YYYY-MM-DDTHH
}

async function readBuckets(): Promise<HourlyBucket[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORE_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as HourlyBucket[]) : [];
  } catch {
    return [];
  }
}

async function writeBuckets(items: HourlyBucket[]): Promise<void> {
  const trimmed = items.slice(-MAX_HOURS);
  await prisma.siteSetting.upsert({
    where: { key: STORE_KEY },
    create: { key: STORE_KEY, value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  });
}

/**
 * 대략적인 비용 계산 (per 1M tokens, USD). 실제 청구액은 아님.
 * 참고: Anthropic/OpenAI 공개가 기준의 근사치.
 */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const table: Record<string, { in: number; out: number }> = {
    "claude-haiku-4-5-20251001": { in: 0.8, out: 4 },
    "claude-haiku-4-5": { in: 0.8, out: 4 },
    "claude-sonnet-4-5": { in: 3, out: 15 },
    "claude-opus-4-7": { in: 15, out: 75 },
    "gpt-4o-mini": { in: 0.15, out: 0.6 },
    "gpt-4o": { in: 2.5, out: 10 },
  };
  const key = Object.keys(table).find((k) => model.startsWith(k));
  const rate = key ? table[key] : { in: 3, out: 15 };
  return (
    (inputTokens / 1_000_000) * rate.in + (outputTokens / 1_000_000) * rate.out
  );
}

/** 메트릭 이벤트 기록 (best-effort). */
export async function recordMetric(event: AIMetricEvent): Promise<void> {
  try {
    const buckets = await readBuckets();
    const h = hourKey(new Date(event.timestamp));
    let bucket = buckets.find((b) => b.hour === h);
    if (!bucket) {
      bucket = { hour: h, byFunction: {} };
      buckets.push(bucket);
      // Keep sorted ascending by hour string
      buckets.sort((a, b) => (a.hour < b.hour ? -1 : 1));
    }
    const byFn = (bucket.byFunction[event.function] ??= {});
    const cell = (byFn[event.model] ??= {
      calls: 0,
      errors: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMsSum: 0,
      costUsd: 0,
    });
    cell.calls += 1;
    if (!event.success) cell.errors += 1;
    cell.inputTokens += event.inputTokens;
    cell.outputTokens += event.outputTokens;
    cell.latencyMsSum += event.latencyMs;
    cell.costUsd += event.costUsd;
    await writeBuckets(buckets);
    // 월 예산 브레이커용 누적(best-effort). ai-budget-guard 가 이 값으로 월 상한 판단.
    if (event.success && event.costUsd > 0) {
      void (await import("@/lib/services/ai-budget-guard")).recordAiSpend(event.costUsd);
    }
  } catch (err) {
    logger.warn("[ai-metrics] record failed", err);
  }
}

export type AggregatedMetric = {
  calls: number;
  errors: number;
  inputTokens: number;
  outputTokens: number;
  avgLatencyMs: number;
  costUsd: number;
  errorRate: number;
};

function empty(): AggregatedMetric {
  return {
    calls: 0,
    errors: 0,
    inputTokens: 0,
    outputTokens: 0,
    avgLatencyMs: 0,
    costUsd: 0,
    errorRate: 0,
  };
}

function foldCell(
  acc: AggregatedMetric,
  cell: {
    calls: number;
    errors: number;
    inputTokens: number;
    outputTokens: number;
    latencyMsSum: number;
    costUsd: number;
  },
  latencySumAcc: { sum: number; calls: number }
): void {
  acc.calls += cell.calls;
  acc.errors += cell.errors;
  acc.inputTokens += cell.inputTokens;
  acc.outputTokens += cell.outputTokens;
  acc.costUsd += cell.costUsd;
  latencySumAcc.sum += cell.latencyMsSum;
  latencySumAcc.calls += cell.calls;
}

function finalize(
  acc: AggregatedMetric,
  latencySumAcc: { sum: number; calls: number }
): AggregatedMetric {
  acc.avgLatencyMs = latencySumAcc.calls > 0 ? latencySumAcc.sum / latencySumAcc.calls : 0;
  acc.errorRate = acc.calls > 0 ? acc.errors / acc.calls : 0;
  return acc;
}

export type MetricsSummary = {
  total: AggregatedMetric;
  byFunction: Record<string, AggregatedMetric>;
  byModel: Record<string, AggregatedMetric>;
  byDay: Array<{ day: string; metric: AggregatedMetric }>;
  hoursCovered: number;
};

export async function getSummary(hours = 24): Promise<MetricsSummary> {
  const buckets = await readBuckets();
  const now = new Date();
  const cutoff = new Date(now.getTime() - hours * 3600_000);
  const cutoffKey = hourKey(cutoff);
  const relevant = buckets.filter((b) => b.hour >= cutoffKey);

  const total = empty();
  const totalLat = { sum: 0, calls: 0 };
  const byFunction: Record<string, AggregatedMetric> = {};
  const byFunctionLat: Record<string, { sum: number; calls: number }> = {};
  const byModel: Record<string, AggregatedMetric> = {};
  const byModelLat: Record<string, { sum: number; calls: number }> = {};
  const byDayMap: Record<
    string,
    { metric: AggregatedMetric; lat: { sum: number; calls: number } }
  > = {};

  for (const b of relevant) {
    const day = b.hour.slice(0, 10);
    if (!byDayMap[day]) byDayMap[day] = { metric: empty(), lat: { sum: 0, calls: 0 } };
    for (const [fn, models] of Object.entries(b.byFunction)) {
      if (!byFunction[fn]) {
        byFunction[fn] = empty();
        byFunctionLat[fn] = { sum: 0, calls: 0 };
      }
      for (const [model, cell] of Object.entries(models)) {
        if (!byModel[model]) {
          byModel[model] = empty();
          byModelLat[model] = { sum: 0, calls: 0 };
        }
        foldCell(total, cell, totalLat);
        foldCell(byFunction[fn], cell, byFunctionLat[fn]);
        foldCell(byModel[model], cell, byModelLat[model]);
        foldCell(byDayMap[day].metric, cell, byDayMap[day].lat);
      }
    }
  }
  finalize(total, totalLat);
  for (const k of Object.keys(byFunction)) finalize(byFunction[k], byFunctionLat[k]);
  for (const k of Object.keys(byModel)) finalize(byModel[k], byModelLat[k]);
  const byDay = Object.entries(byDayMap)
    .map(([day, v]) => ({ day, metric: finalize(v.metric, v.lat) }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));

  return { total, byFunction, byModel, byDay, hoursCovered: relevant.length };
}
