/**
 * 광고 자동 최적화 서비스.
 *
 * - UTM 대시보드(utm-tracking-service) 를 기반으로 캠페인별 CPA/전환율/ROAS 계산.
 * - 관리자 수동 입력 광고비 (SiteSetting `ad.spend.{campaign}`) 를 곱해 CPA/ROAS 도출.
 * - 규칙 기반 추천 (예: "전환율 상위 30% + CPA 평균 이하 → 예산 ↑").
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { getUtmDashboard, type UtmDateRange } from "@/lib/services/utm-tracking-service";

const SPEND_KEY_PREFIX = "ad.spend.";

// 사건 1건당 추정 평균 매출 (₩). ROAS 근사치 계산용. 향후 실적 기반으로 대체.
const DEFAULT_ESTIMATED_REVENUE_PER_INQUIRY = 500_000;

export type AdSpendEntry = {
  weekStart: string; // ISO date (Monday)
  amount: number; // ₩
};

export type AdCampaignRow = {
  campaign: string;
  source: string;
  medium: string;
  inquiries: number;
  conversionRate: number; // 0-1
  spend: number; // ₩ (누적 최근 rangeDays 기준)
  cpa: number; // ₩ per inquiry
  roas: number; // multiplier
};

export type AdRecommendation = {
  campaign: string;
  action: "increase" | "decrease" | "maintain" | "test";
  message: string;
  confidence: "high" | "medium" | "low";
};

export type AdOptimizerReport = {
  rangeDays: number;
  rows: AdCampaignRow[];
  recommendations: AdRecommendation[];
  totals: {
    inquiries: number;
    spend: number;
    avgCpa: number;
    avgConversion: number;
  };
};

function spendKey(campaign: string): string {
  return `${SPEND_KEY_PREFIX}${campaign}`;
}

export async function getCampaignSpend(campaign: string): Promise<AdSpendEntry[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: spendKey(campaign) } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is AdSpendEntry =>
        e && typeof e === "object" && typeof e.weekStart === "string" && typeof e.amount === "number",
    );
  } catch (err) {
    logger.warn("[ad-optimizer] spend read failed", err);
    return [];
  }
}

export async function setCampaignSpend(campaign: string, entries: AdSpendEntry[]): Promise<void> {
  const value = JSON.stringify(entries);
  await prisma.siteSetting.upsert({
    where: { key: spendKey(campaign) },
    create: { key: spendKey(campaign), value },
    update: { value },
  });
}

/** 하나의 (캠페인, 주차) 셀 업데이트. */
export async function updateCampaignSpendCell(
  campaign: string,
  weekStart: string,
  amount: number,
): Promise<AdSpendEntry[]> {
  const entries = await getCampaignSpend(campaign);
  const idx = entries.findIndex((e) => e.weekStart === weekStart);
  if (idx >= 0) entries[idx] = { weekStart, amount };
  else entries.push({ weekStart, amount });
  entries.sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));
  // Keep only most recent 26 weeks (~6 months)
  const trimmed = entries.slice(-26);
  await setCampaignSpend(campaign, trimmed);
  return trimmed;
}

function sumSpendWithinDays(entries: AdSpendEntry[], days: number): number {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries
    .filter((e) => {
      const t = new Date(e.weekStart).getTime();
      return Number.isFinite(t) && t >= since;
    })
    .reduce((s, e) => s + (Number.isFinite(e.amount) ? e.amount : 0), 0);
}

export async function generateReport(rangeDays: UtmDateRange = 30): Promise<AdOptimizerReport> {
  const dashboard = await getUtmDashboard(rangeDays);
  const rows: AdCampaignRow[] = [];

  for (const r of dashboard.rows) {
    const spendEntries = await getCampaignSpend(r.campaign);
    const spend = sumSpendWithinDays(spendEntries, rangeDays);
    const cpa = r.inquiries > 0 ? Math.round(spend / r.inquiries) : 0;
    const revenue = r.inquiries * DEFAULT_ESTIMATED_REVENUE_PER_INQUIRY;
    const roas = spend > 0 ? Number((revenue / spend).toFixed(2)) : 0;
    rows.push({
      campaign: r.campaign,
      source: r.source,
      medium: r.medium,
      inquiries: r.inquiries,
      conversionRate: r.conversionRate,
      spend,
      cpa,
      roas,
    });
  }

  const inquiriesTotal = rows.reduce((s, r) => s + r.inquiries, 0);
  const spendTotal = rows.reduce((s, r) => s + r.spend, 0);
  const cpaValues = rows.filter((r) => r.cpa > 0).map((r) => r.cpa);
  const convValues = rows.map((r) => r.conversionRate);
  const avgCpa =
    cpaValues.length > 0 ? Math.round(cpaValues.reduce((s, v) => s + v, 0) / cpaValues.length) : 0;
  const avgConversion =
    convValues.length > 0 ? convValues.reduce((s, v) => s + v, 0) / convValues.length : 0;

  const recommendations = buildRecommendations(rows, avgCpa, avgConversion);

  return {
    rangeDays,
    rows,
    recommendations,
    totals: {
      inquiries: inquiriesTotal,
      spend: spendTotal,
      avgCpa,
      avgConversion,
    },
  };
}

function buildRecommendations(
  rows: AdCampaignRow[],
  avgCpa: number,
  avgConversion: number,
): AdRecommendation[] {
  const out: AdRecommendation[] = [];
  for (const r of rows) {
    if (r.inquiries === 0 && r.spend > 0) {
      out.push({
        campaign: r.campaign,
        action: "decrease",
        message: `${r.campaign} — 지출 ₩${r.spend.toLocaleString("ko-KR")} vs 전환 0건. 예산 축소 또는 소재 교체 권장.`,
        confidence: "high",
      });
      continue;
    }
    if (r.inquiries === 0) {
      out.push({
        campaign: r.campaign,
        action: "test",
        message: `${r.campaign} — 데이터 부족. 소량 예산으로 3~4주 테스트 후 재평가.`,
        confidence: "low",
      });
      continue;
    }
    if (avgCpa > 0 && r.cpa > 0 && r.cpa < avgCpa * 0.7 && r.conversionRate >= avgConversion) {
      out.push({
        campaign: r.campaign,
        action: "increase",
        message: `${r.campaign} — CPA ₩${r.cpa.toLocaleString("ko-KR")} (평균 대비 30% 낮음), 전환율 ${(r.conversionRate * 100).toFixed(1)}%. 예산 30% ↑ 권장.`,
        confidence: "high",
      });
      continue;
    }
    if (avgCpa > 0 && r.cpa > avgCpa * 1.5) {
      out.push({
        campaign: r.campaign,
        action: "decrease",
        message: `${r.campaign} — CPA ₩${r.cpa.toLocaleString("ko-KR")} (평균 대비 50% 이상 높음). 예산 20% ↓ 또는 랜딩 페이지 개선 권장.`,
        confidence: "medium",
      });
      continue;
    }
    if (r.roas >= 3) {
      out.push({
        campaign: r.campaign,
        action: "increase",
        message: `${r.campaign} — ROAS ${r.roas}x. 유지 또는 소폭 증액 검토.`,
        confidence: "medium",
      });
      continue;
    }
    out.push({
      campaign: r.campaign,
      action: "maintain",
      message: `${r.campaign} — 평균 수준. 현재 유지 후 소재 A/B 테스트 권장.`,
      confidence: "low",
    });
  }
  // Top 5 by confidence
  const rank = { high: 0, medium: 1, low: 2 } as const;
  return out.sort((a, b) => rank[a.confidence] - rank[b.confidence]).slice(0, 5);
}
