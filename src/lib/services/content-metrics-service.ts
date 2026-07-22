/**
 * 콘텐츠 주간 성과 스냅샷 서비스.
 *
 * 네이버 블로그 + LinkedIn 지표를 주 단위로 수기 기록하고,
 * 전주 대비(WoW) 증감과 분야(소재)별 랭킹 통계를 계산한다.
 *
 * 외부 API 호출 없음(모든 수치는 관리자 수기 입력). 순수 DB.
 */

import { prisma } from "@/lib/prisma/client";

export type MetricChannel = "NAVER" | "LINKEDIN";

export type TopItemInput = {
  channel: MetricChannel;
  rank: number;
  title: string;
  area?: string | null;
  views?: number | null;
};

export type ReferralSlice = { label: string; pct: number };

export type WeekInput = {
  weekStart: string; // YYYY-MM-DD (고유키)
  weekEnd?: string | null;
  updatedOn?: string | null;
  naverViews?: number | null;
  naverRevisitRate?: number | null;
  naverAiCitations?: number | null;
  naverReferral?: ReferralSlice[] | null;
  naverInquiries?: number | null;
  naverInquiryNote?: string | null;
  liImpressions?: number | null;
  liMemberReach?: number | null;
  liFollowers?: number | null;
  liFollowerDelta?: number | null;
  insight?: string | null;
  topItems?: TopItemInput[];
};

export type WeekRecord = {
  id: string;
  weekStart: string;
  weekEnd: string | null;
  updatedOn: string | null;
  naverViews: number | null;
  naverRevisitRate: number | null;
  naverAiCitations: number | null;
  naverReferral: ReferralSlice[];
  naverInquiries: number | null;
  naverInquiryNote: string | null;
  liImpressions: number | null;
  liMemberReach: number | null;
  liFollowers: number | null;
  liFollowerDelta: number | null;
  insight: string | null;
  topItems: TopItemInput[];
  /** 전주 대비 증감 (이전 weekStart 행 기준, 없으면 null) */
  deltas: {
    naverViews: number | null;
    naverAiCitations: number | null;
    liImpressions: number | null;
    liMemberReach: number | null;
    liFollowers: number | null;
  };
};

export type AreaRankRow = {
  area: string;
  channel: MetricChannel | "ALL";
  totalViews: number;
  appearances: number;
};

function parseReferral(json: string | null): ReferralSlice[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((s) => s && typeof s.label === "string" && typeof s.pct === "number")
        .map((s) => ({ label: s.label, pct: s.pct }));
    }
  } catch {
    /* ignore malformed */
  }
  return [];
}

function delta(curr: number | null, prev: number | null): number | null {
  if (curr === null || curr === undefined || prev === null || prev === undefined) return null;
  return curr - prev;
}

/** 전체 주간 스냅샷 (weekStart 내림차순) + WoW 증감 계산. */
export async function listWeeks(): Promise<WeekRecord[]> {
  const rows = await prisma.contentMetricWeek.findMany({
    orderBy: { weekStart: "desc" },
    include: { topItems: { orderBy: [{ channel: "asc" }, { rank: "asc" }] } }
  });

  return rows.map((row, idx) => {
    // rows는 내림차순 → 다음 인덱스가 전주(더 과거)
    const prev = rows[idx + 1];
    return {
      id: row.id,
      weekStart: row.weekStart,
      weekEnd: row.weekEnd,
      updatedOn: row.updatedOn,
      naverViews: row.naverViews,
      naverRevisitRate: row.naverRevisitRate,
      naverAiCitations: row.naverAiCitations,
      naverReferral: parseReferral(row.naverReferralJson),
      naverInquiries: row.naverInquiries,
      naverInquiryNote: row.naverInquiryNote,
      liImpressions: row.liImpressions,
      liMemberReach: row.liMemberReach,
      liFollowers: row.liFollowers,
      liFollowerDelta: row.liFollowerDelta,
      insight: row.insight,
      topItems: row.topItems.map((t) => ({
        channel: t.channel as MetricChannel,
        rank: t.rank,
        title: t.title,
        area: t.area,
        views: t.views
      })),
      deltas: {
        naverViews: prev ? delta(row.naverViews, prev.naverViews) : null,
        naverAiCitations: prev ? delta(row.naverAiCitations, prev.naverAiCitations) : null,
        liImpressions: prev ? delta(row.liImpressions, prev.liImpressions) : null,
        liMemberReach: prev ? delta(row.liMemberReach, prev.liMemberReach) : null,
        liFollowers: prev ? delta(row.liFollowers, prev.liFollowers) : null
      }
    };
  });
}

/** weekStart 기준 upsert. topItems는 통째로 교체. */
export async function upsertWeek(input: WeekInput): Promise<{ id: string }> {
  const weekStart = input.weekStart.trim();
  if (!weekStart) throw new Error("weekStart는 필수입니다.");

  const data = {
    weekEnd: input.weekEnd?.trim() || null,
    updatedOn: input.updatedOn?.trim() || null,
    naverViews: input.naverViews ?? null,
    naverRevisitRate: input.naverRevisitRate ?? null,
    naverAiCitations: input.naverAiCitations ?? null,
    naverReferralJson:
      input.naverReferral && input.naverReferral.length > 0
        ? JSON.stringify(input.naverReferral)
        : null,
    naverInquiries: input.naverInquiries ?? null,
    naverInquiryNote: input.naverInquiryNote?.trim() || null,
    liImpressions: input.liImpressions ?? null,
    liMemberReach: input.liMemberReach ?? null,
    liFollowers: input.liFollowers ?? null,
    liFollowerDelta: input.liFollowerDelta ?? null,
    insight: input.insight?.trim() || null
  };

  const cleanTop = (input.topItems ?? [])
    .filter((t) => t.title && t.title.trim())
    .map((t) => ({
      channel: t.channel,
      rank: t.rank,
      title: t.title.trim(),
      area: t.area?.trim() || null,
      views: t.views ?? null
    }));

  const week = await prisma.contentMetricWeek.upsert({
    where: { weekStart },
    create: { weekStart, ...data, topItems: { create: cleanTop } },
    update: { ...data, topItems: { deleteMany: {}, create: cleanTop } },
    select: { id: true }
  });
  return week;
}

export async function deleteWeek(id: string): Promise<void> {
  await prisma.contentMetricWeek.delete({ where: { id } });
}

/**
 * 분야(소재)별 랭킹 — 어떤 분야가 조회수/노출 총합에서 우선순위를 차지하는지.
 * 모든 주의 TOP 아이템을 area로 집계.
 */
export async function getAreaRanking(): Promise<AreaRankRow[]> {
  const items = await prisma.contentMetricTopItem.findMany({
    where: { area: { not: null } },
    select: { channel: true, area: true, views: true }
  });

  // 채널별로 분리 집계 — 네이버 조회수와 LinkedIn 노출수는 단위가 달라 합산이 오도됨.
  const map = new Map<string, AreaRankRow>();
  for (const it of items) {
    const area = (it.area ?? "").trim();
    if (!area) continue;
    const channel = (it.channel as "NAVER" | "LINKEDIN") ?? "NAVER";
    const key = `${channel}::${area}`;
    const row = map.get(key) ?? { area, channel, totalViews: 0, appearances: 0 };
    row.totalViews += it.views ?? 0;
    row.appearances += 1;
    map.set(key, row);
  }
  return [...map.values()].sort(
    (a, b) =>
      (a.channel === b.channel ? 0 : a.channel === "NAVER" ? -1 : 1) ||
      b.totalViews - a.totalViews ||
      b.appearances - a.appearances
  );
}
