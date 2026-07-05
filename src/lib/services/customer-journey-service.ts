/**
 * 의뢰인 여정 (Customer Journey) 분석.
 * 단계별 소요시간(P50, P90) 계산 + 병목 감지.
 */
import { prisma } from "@/lib/prisma/client";

export type JourneyStage =
  | "inquiry_to_first_response"
  | "first_response_to_contract"
  | "contract_to_case_opened"
  | "case_opened_to_next_action"
  | "case_opened_to_closed";

export interface StageMetric {
  stage: JourneyStage;
  label: string;
  medianHours: number;
  p90Hours: number;
  sampleCount: number;
  gap: number; // p90 - median
}

export interface JourneyReport {
  totalClients: number;
  stages: StageMetric[];
  bottleneckStage: JourneyStage | null;
  suggestions: string[];
  fromDate: string;
  toDate: string;
}

const STAGE_LABELS: Record<JourneyStage, string> = {
  inquiry_to_first_response: "문의 → 최초 응대",
  first_response_to_contract: "응대 → 계약 확정",
  contract_to_case_opened: "계약 → 사건 개시",
  case_opened_to_next_action: "사건 개시 → 다음 액션",
  case_opened_to_closed: "사건 개시 → 종결",
};

function hoursBetween(a: Date | null | undefined, b: Date | null | undefined): number | null {
  if (!a || !b) return null;
  const diff = b.getTime() - a.getTime();
  if (diff < 0) return null;
  return diff / 3_600_000;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

export async function computeJourneyReport(
  options?: { fromDate?: Date; toDate?: Date; category?: string }
): Promise<JourneyReport> {
  const toDate = options?.toDate ?? new Date();
  const fromDate = options?.fromDate ?? new Date(toDate.getTime() - 90 * 24 * 3_600_000);

  const inquiries = await prisma.inquiry.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      ...(options?.category ? { inquiryType: options.category as never } : {}),
    },
    select: {
      id: true,
      createdAt: true,
      firstResponseAt: true,
    },
  });

  const inquiryIds = inquiries.map((i) => i.id);

  // contractDrafts (FINALIZED = 계약 확정 시점, updatedAt 기준)
  const contracts = await prisma.contractDraft.findMany({
    where: { inquiryId: { in: inquiryIds }, status: "FINALIZED" },
    select: { inquiryId: true, updatedAt: true },
    orderBy: { updatedAt: "asc" },
  });
  const contractByInquiry = new Map<string, Date>();
  for (const c of contracts) {
    if (!contractByInquiry.has(c.inquiryId)) contractByInquiry.set(c.inquiryId, c.updatedAt);
  }

  const caseMatters = await prisma.caseMatter.findMany({
    where: { inquiryId: { in: inquiryIds } },
    select: {
      inquiryId: true,
      openedAt: true,
      closedAt: true,
      nextActionAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const cmByInquiry = new Map<string, { openedAt: Date | null; closedAt: Date | null; nextActionAt: Date | null }>();
  for (const cm of caseMatters) {
    if (!cm.inquiryId) continue;
    if (!cmByInquiry.has(cm.inquiryId)) {
      cmByInquiry.set(cm.inquiryId, { openedAt: cm.openedAt, closedAt: cm.closedAt, nextActionAt: cm.nextActionAt });
    }
  }

  const buckets: Record<JourneyStage, number[]> = {
    inquiry_to_first_response: [],
    first_response_to_contract: [],
    contract_to_case_opened: [],
    case_opened_to_next_action: [],
    case_opened_to_closed: [],
  };

  for (const inq of inquiries) {
    const contractAt = contractByInquiry.get(inq.id) ?? null;
    const cm = cmByInquiry.get(inq.id) ?? null;
    const h1 = hoursBetween(inq.createdAt, inq.firstResponseAt);
    if (h1 !== null) buckets.inquiry_to_first_response.push(h1);
    const h2 = hoursBetween(inq.firstResponseAt, contractAt);
    if (h2 !== null) buckets.first_response_to_contract.push(h2);
    const h3 = hoursBetween(contractAt, cm?.openedAt ?? null);
    if (h3 !== null) buckets.contract_to_case_opened.push(h3);
    const h4 = hoursBetween(cm?.openedAt ?? null, cm?.nextActionAt ?? null);
    if (h4 !== null) buckets.case_opened_to_next_action.push(h4);
    const h5 = hoursBetween(cm?.openedAt ?? null, cm?.closedAt ?? null);
    if (h5 !== null) buckets.case_opened_to_closed.push(h5);
  }

  const stages: StageMetric[] = (Object.keys(buckets) as JourneyStage[]).map((stage) => {
    const arr = [...buckets[stage]].sort((a, b) => a - b);
    const median = percentile(arr, 0.5);
    const p90 = percentile(arr, 0.9);
    return {
      stage,
      label: STAGE_LABELS[stage],
      medianHours: Math.round(median * 10) / 10,
      p90Hours: Math.round(p90 * 10) / 10,
      sampleCount: arr.length,
      gap: Math.round((p90 - median) * 10) / 10,
    };
  });

  const candidates = stages.filter((s) => s.sampleCount >= 5);
  const bottleneck = candidates.length
    ? candidates.reduce((max, s) => (s.gap > max.gap ? s : max))
    : null;

  const suggestions: string[] = [];
  if (bottleneck) {
    switch (bottleneck.stage) {
      case "inquiry_to_first_response":
        suggestions.push("최초 응대 SLA 강화 — 야간/휴일 AI 자동 응대 확대");
        suggestions.push("영업시간 알림톡 자동 발송 스크립트 재점검");
        break;
      case "first_response_to_contract":
        suggestions.push("견적 표준화·자동화 — 반복 견적 템플릿 상단 노출");
        suggestions.push("계약 서명 리마인더 자동화 (3일·7일)");
        break;
      case "contract_to_case_opened":
        suggestions.push("계약 확정 후 자동 케이스 개시 트리거 검토");
        suggestions.push("사건번호 부여 지연 원인 로그 확인");
        break;
      case "case_opened_to_next_action":
        suggestions.push("다음 액션 자동 추천 (Auto-followup) 활성화 확인");
        break;
      case "case_opened_to_closed":
        suggestions.push("장기 진행 사건 리뷰 — 30일 이상 미결 사건 알림");
        break;
    }
  }
  return {
    totalClients: inquiries.length,
    stages,
    bottleneckStage: bottleneck?.stage ?? null,
    suggestions,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
  };
}
