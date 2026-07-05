/**
 * A/B 실험 결과 자동 반영.
 *
 * - ab-test-service 의 실험 결과를 chi-square 유의성 검정으로 평가.
 * - 조건: 각 변형 최소 100 샘플, 실험 지속 7일 이상, alpha=0.05.
 * - 통과 시 SiteSetting `ab.defaults.{testKey}` 를 승자 변형으로 업데이트.
 * - 승격 이력을 `ab.autoPromote.history` 에 기록.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { getTestResults, listTests } from "@/lib/services/ab-test-service";

const HISTORY_KEY = "ab.autoPromote.history";
const MIN_SAMPLES_PER_VARIANT = 100;
const MIN_DAYS_ACTIVE = 7;
const ALPHA = 0.05;
const CHI_SQ_CRIT_1DF = 3.841; // 1-df, alpha=0.05
const MAX_HISTORY = 500;

export type PromotionEvent = {
  id: string;
  testKey: string;
  winner: string;
  loserVariants: string[];
  chiSquare: number;
  totalSamples: number;
  timestamp: string;
  reason?: string;
};

function newId(): string {
  return `abp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function readHistory(): Promise<PromotionEvent[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: HISTORY_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as PromotionEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeHistory(items: PromotionEvent[]): Promise<void> {
  const trimmed = items.slice(-MAX_HISTORY);
  await prisma.siteSetting.upsert({
    where: { key: HISTORY_KEY },
    create: { key: HISTORY_KEY, value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  });
}

async function readDefault(testKey: string): Promise<string | null> {
  const row = await prisma.siteSetting
    .findUnique({ where: { key: `ab.defaults.${testKey}` } })
    .catch(() => null);
  return row?.value ?? null;
}

async function writeDefault(testKey: string, variant: string): Promise<void> {
  const key = `ab.defaults.${testKey}`;
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: variant },
    update: { value: variant },
  });
}

/**
 * 2xN chi-square: 관측 vs 기대. 승자와 나머지 그룹 이진 비교.
 * 반환값 유의(true)면 승자로 채택.
 */
export function chiSquare2x2(
  winnerConv: number,
  winnerViews: number,
  otherConv: number,
  otherViews: number
): { statistic: number; significant: boolean } {
  const totalConv = winnerConv + otherConv;
  const totalNoConv = winnerViews - winnerConv + (otherViews - otherConv);
  const totalWinner = winnerViews;
  const totalOther = otherViews;
  const grandTotal = totalWinner + totalOther;
  if (grandTotal === 0) return { statistic: 0, significant: false };

  const observed = [
    winnerConv,
    winnerViews - winnerConv,
    otherConv,
    otherViews - otherConv,
  ];
  const expected = [
    (totalWinner * totalConv) / grandTotal,
    (totalWinner * totalNoConv) / grandTotal,
    (totalOther * totalConv) / grandTotal,
    (totalOther * totalNoConv) / grandTotal,
  ];
  let stat = 0;
  for (let i = 0; i < 4; i++) {
    if (expected[i] > 0) {
      const diff = observed[i] - expected[i];
      stat += (diff * diff) / expected[i];
    }
  }
  return { statistic: stat, significant: stat > CHI_SQ_CRIT_1DF };
}

export type PromoteRunResult = {
  evaluated: number;
  promoted: PromotionEvent[];
  skipped: Array<{ testKey: string; reason: string }>;
};

/**
 * 모든 활성 실험을 평가하고 유의한 승자를 채택.
 */
export async function runAutoPromote(opts?: {
  minSamplesPerVariant?: number;
  minDaysActive?: number;
  experimentStartAt?: Record<string, string>;
}): Promise<PromoteRunResult> {
  const minSamples = opts?.minSamplesPerVariant ?? MIN_SAMPLES_PER_VARIANT;
  const minDays = opts?.minDaysActive ?? MIN_DAYS_ACTIVE;
  const tests = listTests();
  const promoted: PromotionEvent[] = [];
  const skipped: Array<{ testKey: string; reason: string }> = [];

  const history = await readHistory();

  for (const test of tests) {
    if (!test.active) {
      skipped.push({ testKey: test.key, reason: "inactive" });
      continue;
    }
    const result = getTestResults(test.key);
    if (!result.winner) {
      skipped.push({ testKey: test.key, reason: "no winner candidate" });
      continue;
    }
    const startAt = opts?.experimentStartAt?.[test.key];
    if (startAt) {
      const daysActive =
        (Date.now() - new Date(startAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysActive < minDays) {
        skipped.push({ testKey: test.key, reason: `active only ${daysActive.toFixed(1)}d` });
        continue;
      }
    }
    const under = result.variants.filter((v) => v.views < minSamples);
    if (under.length > 0) {
      skipped.push({
        testKey: test.key,
        reason: `insufficient samples (min ${minSamples})`,
      });
      continue;
    }
    const winnerData = result.variants.find((v) => v.name === result.winner);
    if (!winnerData) {
      skipped.push({ testKey: test.key, reason: "winner data missing" });
      continue;
    }
    const others = result.variants.filter((v) => v.name !== result.winner);
    const otherConv = others.reduce((s, v) => s + v.conversions, 0);
    const otherViews = others.reduce((s, v) => s + v.views, 0);
    const chi = chiSquare2x2(
      winnerData.conversions,
      winnerData.views,
      otherConv,
      otherViews
    );
    if (!chi.significant) {
      skipped.push({
        testKey: test.key,
        reason: `not significant (χ²=${chi.statistic.toFixed(3)}, α=${ALPHA})`,
      });
      continue;
    }
    const currentDefault = await readDefault(test.key);
    if (currentDefault === result.winner) {
      skipped.push({ testKey: test.key, reason: "winner already default" });
      continue;
    }
    await writeDefault(test.key, result.winner);
    const event: PromotionEvent = {
      id: newId(),
      testKey: test.key,
      winner: result.winner,
      loserVariants: others.map((v) => v.name),
      chiSquare: Number(chi.statistic.toFixed(3)),
      totalSamples: result.variants.reduce((s, v) => s + v.views, 0),
      timestamp: new Date().toISOString(),
      reason: `chi²=${chi.statistic.toFixed(3)} > ${CHI_SQ_CRIT_1DF}`,
    };
    promoted.push(event);
    history.push(event);
    logger.info("[ab-auto-promote] promoted", event);
  }

  if (promoted.length > 0) await writeHistory(history);

  return { evaluated: tests.length, promoted, skipped };
}

export async function listPromotionHistory(): Promise<PromotionEvent[]> {
  const h = await readHistory();
  return h.slice().reverse();
}

export async function getDefaultVariant(testKey: string): Promise<string | null> {
  return readDefault(testKey);
}
