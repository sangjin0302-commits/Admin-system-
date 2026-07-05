/**
 * 재수임 가능성 점수.
 *
 * CLOSED 사건 clientEmail 별로 12개월 내 재문의 확률 0-100 예측.
 * 요인: NPS(SatisfactionSurvey), 카테고리 반복 성향, 케이스 복잡도, 종결 후 경과월.
 */

import { prisma } from "@/lib/prisma/client";

export type ReengagementScore = {
  clientEmail: string;
  clientName: string | null;
  score: number; // 0-100
  likelyCategory: string;
  suggestedMonth: string; // "2026-09"
  lastCaseCategory: string;
  lastCaseClosedAt: string | null;
  npsScore: number | null;
  factors: string[];
};

const REPEAT_FRIENDLY = new Set(["VISA_STAY", "LICENSE_PERMIT"]);

function scoreOne(input: {
  monthsSinceClose: number;
  nps: number | null;
  category: string;
  riskLevel: string;
  totalCases: number;
}): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 30; // baseline

  // NPS
  if (input.nps != null) {
    if (input.nps >= 9) {
      score += 25;
      factors.push(`NPS ${input.nps} (프로모터)`);
    } else if (input.nps >= 7) {
      score += 12;
      factors.push(`NPS ${input.nps} (중립)`);
    } else {
      score -= 15;
      factors.push(`NPS ${input.nps} (디트랙터)`);
    }
  }

  // 카테고리 반복 성향
  if (REPEAT_FRIENDLY.has(input.category)) {
    score += 20;
    factors.push("반복 수요 카테고리");
  }

  // 사건 수 (충성도)
  if (input.totalCases >= 2) {
    score += 15;
    factors.push(`누적 ${input.totalCases}건 (기존 고객)`);
  }

  // 종결 후 경과월 — 3-9개월이 sweet spot
  if (input.monthsSinceClose >= 3 && input.monthsSinceClose <= 9) {
    score += 10;
    factors.push(`종결 ${input.monthsSinceClose}개월 (재문의 sweet spot)`);
  } else if (input.monthsSinceClose > 12) {
    score -= 15;
    factors.push(`종결 ${input.monthsSinceClose}개월 (관심 감소)`);
  }

  // 복잡도가 높았으면 재수임 확률 감소 (트라우마)
  if (input.riskLevel === "CRITICAL") {
    score -= 8;
    factors.push("과거 CRITICAL 사건");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, factors };
}

function suggestedMonth(score: number, monthsSinceClose: number): string {
  // sweet spot 을 우선 활용해 3-6개월 후 캠페인 제안
  const now = new Date();
  const delayMonths = score >= 70 ? 1 : score >= 40 ? 3 : Math.max(1, 6 - Math.min(monthsSinceClose, 5));
  const target = new Date(now.getFullYear(), now.getMonth() + delayMonths, 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
}

export async function scoreReengagement(clientEmail: string): Promise<ReengagementScore | null> {
  const cases = await prisma.caseMatter.findMany({
    where: {
      status: "CLOSED",
      inquiry: { email: clientEmail },
    },
    orderBy: { closedAt: "desc" },
    include: {
      inquiry: { select: { contactName: true, email: true } },
    },
  });
  if (cases.length === 0) return null;
  const last = cases[0];
  const closedAt = last.closedAt ?? last.updatedAt;
  const monthsSinceClose = Math.round((Date.now() - closedAt.getTime()) / (30 * 24 * 3600 * 1000));

  const survey = await prisma.satisfactionSurvey.findFirst({
    where: { clientEmail, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { score: true },
  });

  const { score, factors } = scoreOne({
    monthsSinceClose,
    nps: survey?.score ?? null,
    category: last.category,
    riskLevel: last.riskLevel,
    totalCases: cases.length,
  });

  return {
    clientEmail,
    clientName: last.inquiry?.contactName ?? null,
    score,
    likelyCategory: last.category,
    suggestedMonth: suggestedMonth(score, monthsSinceClose),
    lastCaseCategory: last.category,
    lastCaseClosedAt: closedAt.toISOString(),
    npsScore: survey?.score ?? null,
    factors,
  };
}

export async function listTopReengagement(limit = 50): Promise<ReengagementScore[]> {
  // 종결된 사건 최근 순으로 unique client email 수집
  const closed = await prisma.caseMatter.findMany({
    where: { status: "CLOSED" },
    orderBy: { closedAt: "desc" },
    take: 800,
    include: { inquiry: { select: { email: true } } },
  });

  const emailSet = new Set<string>();
  for (const c of closed) {
    const em = c.inquiry?.email;
    if (em) emailSet.add(em);
  }

  const scored = await Promise.all(
    [...emailSet].map((em) => scoreReengagement(em).catch(() => null))
  );
  const filtered = scored.filter((s): s is ReengagementScore => s != null);
  filtered.sort((a, b) => b.score - a.score);
  return filtered.slice(0, limit);
}

export function buildCampaignDraft(picks: ReengagementScore[]): {
  subject: string;
  body: string;
  recipients: { email: string; name: string | null }[];
} {
  const catCount = new Map<string, number>();
  for (const p of picks) catCount.set(p.likelyCategory, (catCount.get(p.likelyCategory) ?? 0) + 1);
  const topCat = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "OTHER";

  const subject = `[ETHOS] 다시 도움이 필요하실 때 — ${topCat} 후속 안내`;
  const body =
    `안녕하세요, ETHOS 입니다.\n\n` +
    `이전에 저희와 함께 사건을 잘 마무리하셨던 고객님께 짧게 안내드립니다.\n\n` +
    `- 이전 사건 유형: ${topCat}\n` +
    `- 종결 이후 자주 문의 주시는 후속 절차가 있습니다.\n\n` +
    `필요하시면 회신만 남겨주시면 우선 상담 배정해 드리겠습니다.\n\n` +
    `감사합니다.\nETHOS 팀 드림`;

  return {
    subject,
    body,
    recipients: picks.map((p) => ({ email: p.clientEmail, name: p.clientName })),
  };
}
