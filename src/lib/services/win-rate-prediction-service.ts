import { prisma } from "@/lib/prisma/client";

export type PredictionInput = {
  inquiryType: string;
  urgencyLevel: string;
  qualificationScore: number;
  clientType: string;
  hasPreparedDocuments: boolean;
  consultationRequired: boolean;
};

export type PredictionResult = {
  winProbability: number;
  confidence: number;
  factors: { name: string; impact: number }[];
  recommendation: string;
};

const INQUIRY_TYPE_BASELINE: Record<string, number> = {
  FOREIGNER_VISA: 0.62,
  IMMIGRATION_STAY: 0.58,
  APOSTILLE_CONSULAR: 0.7,
  TRANSLATION_NOTARY: 0.75,
  GENERAL_ADMIN_CIVIL: 0.5,
  CORPORATE_REQUEST: 0.66,
  UNKNOWN: 0.45,
};

const URGENCY_ADJUSTMENT: Record<string, number> = {
  LOW: 0.05,
  NORMAL: 0.0,
  HIGH: -0.03,
  CRITICAL: -0.08,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function predictWinRate(input: PredictionInput): PredictionResult {
  const qualNorm = clamp(input.qualificationScore / 100);
  const baseline = INQUIRY_TYPE_BASELINE[input.inquiryType] ?? 0.5;
  const urgencyAdj = URGENCY_ADJUSTMENT[input.urgencyLevel] ?? 0;
  const docsBoost = input.hasPreparedDocuments ? 1 : 0;
  const corporateBoost = input.clientType === "CORPORATE" ? 1 : 0;
  const consultPenalty = input.consultationRequired ? -0.05 : 0;

  // Weighted sum
  const score =
    qualNorm * 0.4 +
    docsBoost * 0.15 +
    urgencyAdj * 0.1 * 10 + // urgencyAdj is already small; scale moderately
    corporateBoost * 0.1 +
    baseline * 0.25 +
    consultPenalty;

  const winProbability = clamp(score);

  // Confidence: higher when qualification score is decisive and we have docs
  const decisiveness = Math.abs(qualNorm - 0.5) * 2; // 0..1
  const confidence = clamp(0.5 + decisiveness * 0.3 + docsBoost * 0.1);

  const factors: { name: string; impact: number }[] = [
    { name: `자격 점수 (${input.qualificationScore})`, impact: qualNorm * 0.4 },
    { name: `문의 유형 기준선 (${input.inquiryType})`, impact: baseline * 0.25 },
    {
      name: input.hasPreparedDocuments ? "서류 준비 완료" : "서류 미준비",
      impact: docsBoost * 0.15,
    },
    {
      name: `긴급도 (${input.urgencyLevel})`,
      impact: urgencyAdj,
    },
    {
      name: input.clientType === "CORPORATE" ? "기업 고객" : "개인 고객",
      impact: corporateBoost * 0.1,
    },
    {
      name: input.consultationRequired ? "상담 필요" : "상담 불필요",
      impact: consultPenalty,
    },
  ];

  let recommendation = "";
  if (winProbability >= 0.7) {
    recommendation = "수임 가능성이 높습니다. 즉시 견적서와 계약서 초안을 준비하세요.";
  } else if (winProbability >= 0.5) {
    recommendation = "수임 가능성이 보통입니다. 상담을 통해 추가 정보를 확보하세요.";
  } else if (winProbability >= 0.3) {
    recommendation = "수임 가능성이 낮습니다. 자격 요건과 서류 보완을 우선 안내하세요.";
  } else {
    recommendation = "수임 가능성이 매우 낮습니다. 사전 진단과 대안 안내가 필요합니다.";
  }

  return {
    winProbability,
    confidence,
    factors,
    recommendation,
  };
}

export async function getHistoricalWinRate(): Promise<{
  overall: number;
  byType: Record<string, number>;
}> {
  const grouped = await prisma.inquiry.groupBy({
    by: ["inquiryType", "status"],
    _count: { _all: true },
  });

  const totals: Record<string, { won: number; total: number }> = {};
  let overallWon = 0;
  let overallTotal = 0;

  for (const row of grouped) {
    const type = row.inquiryType;
    const count = row._count._all;
    if (!totals[type]) totals[type] = { won: 0, total: 0 };
    totals[type].total += count;
    overallTotal += count;
    if (row.status === "WON") {
      totals[type].won += count;
      overallWon += count;
    }
  }

  const byType: Record<string, number> = {};
  for (const [type, { won, total }] of Object.entries(totals)) {
    byType[type] = total > 0 ? won / total : 0;
  }

  return {
    overall: overallTotal > 0 ? overallWon / overallTotal : 0,
    byType,
  };
}
