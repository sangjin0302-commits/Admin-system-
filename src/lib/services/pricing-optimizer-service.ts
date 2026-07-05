/**
 * 가격 최적화 AI.
 *
 * Quote(status ACCEPTED/REJECTED) + Inquiry(status WON/CLOSED) 이력을 카테고리별로 묶고,
 * 가격대별 수락률 히스토그램을 만든다. 기대 매출 = 가격 × 수락률 을 최대화하는 sweet spot 을 추천.
 *
 * 캐시는 SiteSetting `pricing.optimizer.cache` (TTL 7일). 무거운 쿼리 반복 방지.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const KEY = "pricing.optimizer.cache";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PricePoint = {
  priceBand: number; // 만원 단위 lower bound
  accepted: number;
  rejected: number;
  acceptanceRate: number;
  expectedRevenue: number;
};

export type OptimalPricing = {
  category: string;
  sampleSize: number;
  min: number;
  sweetSpot: number;
  max: number;
  currentAvgQuote: number;
  acceptanceCurve: PricePoint[];
};

type CacheEnvelope = {
  updatedAt: string;
  perCategory: OptimalPricing[];
};

const BAND_WON = 100000; // 10만원 단위

async function loadCache(): Promise<CacheEnvelope | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value) as CacheEnvelope;
    if (Date.now() - new Date(parsed.updatedAt).getTime() > TTL_MS) return null;
    return parsed;
  } catch (err) {
    logger.warn("[pricing-optimizer] cache read failed", err);
    return null;
  }
}

async function saveCache(env: CacheEnvelope): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(env), updatedBy: "pricing-optimizer-service" },
    update: { value: JSON.stringify(env), updatedBy: "pricing-optimizer-service" },
  });
}

type QuoteRow = {
  totalMin: number;
  totalMax: number;
  status: string;
  inquiry: { intakeCategory: string | null };
};

async function loadQuotes(): Promise<QuoteRow[]> {
  const rows = await prisma.quote.findMany({
    where: {
      status: { in: ["ACCEPTED", "REJECTED", "SENT", "EXPIRED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      totalMin: true,
      totalMax: true,
      status: true,
      inquiry: { select: { intakeCategory: true } },
    },
  });
  return rows as QuoteRow[];
}

function bucketPrice(won: number): number {
  return Math.floor(won / BAND_WON) * BAND_WON;
}

function categoryOf(q: QuoteRow): string {
  return q.inquiry.intakeCategory ?? "OTHER";
}

function buildCurve(rows: QuoteRow[]): OptimalPricing[] {
  const grouped = new Map<string, QuoteRow[]>();
  for (const r of rows) {
    const cat = categoryOf(r);
    const list = grouped.get(cat) ?? [];
    list.push(r);
    grouped.set(cat, list);
  }

  const out: OptimalPricing[] = [];
  for (const [cat, list] of grouped) {
    if (list.length < 5) continue;

    const midPrices = list.map((r) => Math.round((r.totalMin + r.totalMax) / 2));
    const avg = Math.round(midPrices.reduce((a, c) => a + c, 0) / midPrices.length);
    const min = Math.min(...midPrices);
    const max = Math.max(...midPrices);

    const bucketMap = new Map<number, { a: number; r: number }>();
    for (const q of list) {
      const mid = Math.round((q.totalMin + q.totalMax) / 2);
      const band = bucketPrice(mid);
      const cur = bucketMap.get(band) ?? { a: 0, r: 0 };
      if (q.status === "ACCEPTED") cur.a += 1;
      else cur.r += 1;
      bucketMap.set(band, cur);
    }

    const curve: PricePoint[] = [...bucketMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([band, v]) => {
        const total = v.a + v.r;
        const rate = total > 0 ? v.a / total : 0;
        return {
          priceBand: band,
          accepted: v.a,
          rejected: v.r,
          acceptanceRate: Number(rate.toFixed(3)),
          expectedRevenue: Math.round(band * rate),
        };
      });

    // Sweet spot: expectedRevenue 최대 band. 표본 부족 band 는 소량 감쇠.
    const scored = curve.map((p) => ({
      p,
      score: p.expectedRevenue * Math.min(1, (p.accepted + p.rejected) / 5),
    }));
    scored.sort((a, b) => b.score - a.score);
    const sweetSpot = scored[0]?.p.priceBand ?? avg;

    out.push({
      category: cat,
      sampleSize: list.length,
      min,
      sweetSpot,
      max,
      currentAvgQuote: avg,
      acceptanceCurve: curve,
    });
  }

  out.sort((a, b) => b.sampleSize - a.sampleSize);
  return out;
}

export async function computeAllPricing(): Promise<CacheEnvelope> {
  const rows = await loadQuotes();
  const perCategory = buildCurve(rows);
  const env: CacheEnvelope = { updatedAt: new Date().toISOString(), perCategory };
  await saveCache(env);
  return env;
}

export async function getAllPricing(): Promise<CacheEnvelope> {
  const cached = await loadCache();
  if (cached) return cached;
  return computeAllPricing();
}

export async function getOptimalPricing(category: string): Promise<OptimalPricing | null> {
  const env = await getAllPricing();
  return env.perCategory.find((p) => p.category === category) ?? null;
}
