/**
 * 예상 처리 기간 예측.
 *
 * 종결된 CaseMatter 의 (closedAt - openedAt|createdAt) 을 카테고리 × complexity 로 묶어 median/p90.
 * 캐시 SiteSetting `duration.predictor.cache`, TTL 14일.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const KEY = "duration.predictor.cache";
const TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type Complexity = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type Prediction = {
  category: string;
  complexity: Complexity;
  sampleSize: number;
  p50Days: number;
  p90Days: number;
  factors: string[];
};

type CacheEnvelope = {
  updatedAt: string;
  predictions: Prediction[];
};

async function readCache(): Promise<CacheEnvelope | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (!row?.value) return null;
    const env = JSON.parse(row.value) as CacheEnvelope;
    if (Date.now() - new Date(env.updatedAt).getTime() > TTL_MS) return null;
    return env;
  } catch (err) {
    logger.warn("[duration-predictor] read failed", err);
    return null;
  }
}

async function writeCache(env: CacheEnvelope): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(env), updatedBy: "duration-predictor-service" },
    update: { value: JSON.stringify(env), updatedBy: "duration-predictor-service" },
  });
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

async function computeAll(): Promise<CacheEnvelope> {
  const cases = await prisma.caseMatter.findMany({
    where: { status: "CLOSED", closedAt: { not: null } },
    take: 1000,
    orderBy: { closedAt: "desc" },
    select: { category: true, riskLevel: true, openedAt: true, closedAt: true, createdAt: true },
  });

  const groups = new Map<string, number[]>();
  for (const c of cases) {
    const start = c.openedAt ?? c.createdAt;
    const end = c.closedAt;
    if (!end) continue;
    const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)));
    const key = `${c.category}|${c.riskLevel}`;
    const list = groups.get(key) ?? [];
    list.push(days);
    groups.set(key, list);
  }

  const predictions: Prediction[] = [];
  for (const [key, list] of groups) {
    if (list.length < 3) continue;
    const [category, complexity] = key.split("|") as [string, Complexity];
    const sorted = [...list].sort((a, b) => a - b);
    const p50 = percentile(sorted, 0.5);
    const p90 = percentile(sorted, 0.9);
    const factors: string[] = [];
    if (complexity === "HIGH" || complexity === "CRITICAL") factors.push("리스크 레벨 상향 반영");
    if (category === "ADMIN_APPEAL") factors.push("행정심판 표준 심리기일");
    if (category === "VISA_STAY") factors.push("체류자격 심사 대기");
    if (p90 - p50 > 30) factors.push("변동성 큼 — 사안별 확인 필요");
    predictions.push({
      category,
      complexity,
      sampleSize: list.length,
      p50Days: p50,
      p90Days: p90,
      factors,
    });
  }

  const env: CacheEnvelope = { updatedAt: new Date().toISOString(), predictions };
  await writeCache(env);
  return env;
}

async function getAll(): Promise<CacheEnvelope> {
  const cached = await readCache();
  if (cached) return cached;
  return computeAll();
}

/**
 * 카테고리 문자열 정규화 — CaseMatterCategory enum 값 또는 intakeCategory 문자열.
 */
function normalizeCategory(cat: string | null | undefined): string {
  if (!cat) return "OTHER";
  return cat.toUpperCase();
}

export async function predictDuration(
  category: string | null | undefined,
  complexity: Complexity = "NORMAL"
): Promise<{ p50Days: number; p90Days: number; factors: string[]; sampleSize: number } | null> {
  const env = await getAll();
  const norm = normalizeCategory(category);
  const exact = env.predictions.find((p) => p.category === norm && p.complexity === complexity);
  if (exact) return { p50Days: exact.p50Days, p90Days: exact.p90Days, factors: exact.factors, sampleSize: exact.sampleSize };

  // Fallback: same category any complexity
  const anyComplex = env.predictions.filter((p) => p.category === norm);
  if (anyComplex.length > 0) {
    const p50 = Math.round(anyComplex.reduce((a, c) => a + c.p50Days, 0) / anyComplex.length);
    const p90 = Math.round(anyComplex.reduce((a, c) => a + c.p90Days, 0) / anyComplex.length);
    return { p50Days: p50, p90Days: p90, factors: ["같은 카테고리 평균"], sampleSize: anyComplex.reduce((a, c) => a + c.sampleSize, 0) };
  }

  // Global fallback
  if (env.predictions.length > 0) {
    const p50 = Math.round(env.predictions.reduce((a, c) => a + c.p50Days, 0) / env.predictions.length);
    const p90 = Math.round(env.predictions.reduce((a, c) => a + c.p90Days, 0) / env.predictions.length);
    return { p50Days: p50, p90Days: p90, factors: ["전체 평균 (카테고리 표본 부족)"], sampleSize: env.predictions.reduce((a, c) => a + c.sampleSize, 0) };
  }

  return null;
}

export async function listAllPredictions(): Promise<CacheEnvelope> {
  return getAll();
}
