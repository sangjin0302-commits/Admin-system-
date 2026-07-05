/**
 * 미수금 리스크 스코어.
 *
 * 활성 CaseMatter 별로 0-100 리스크 점수 산정.
 * factors: 과거 결제 이력 · 견적 이후 경과일 · 최근 커뮤니케이션 활동 · 카테고리
 *
 * 서비스는 순수 계산 함수 + 배치 조회 helper. workflow 트리거는 caller 에서.
 */

import { prisma } from "@/lib/prisma/client";

export type PaymentRisk = {
  caseId: string;
  caseNo: string | null;
  title: string;
  status: string;
  category: string;
  score: number; // 0-100
  factors: string[];
  recommendation: string;
  clientEmail: string | null;
  clientName: string | null;
};

const ACTIVE_STATUSES = [
  "INTAKE_REVIEW",
  "CONSULTING",
  "QUOTED",
  "CONTRACT_PENDING",
  "OPEN",
  "DOCUMENT_COLLECTING",
  "DOCUMENT_REVIEWING",
  "READY_TO_SUBMIT",
  "SUBMITTED",
  "SUPPLEMENT_REQUESTED",
  "WAITING_AGENCY",
  "RESULT_RECEIVED",
  "CLOSING",
] as const;

const HIGH_RISK_CATS = new Set(["ADMIN_APPEAL", "CONTRACT_INVESTIGATION"]);

type ScoreResult = { score: number; factors: string[]; recommendation: string };

function computeScore(input: {
  daysSinceQuote: number | null;
  paymentSuccessRatio: number | null; // 0-1 or null
  daysSinceContact: number | null;
  category: string;
  hasUnpaidInvoice: boolean;
}): ScoreResult {
  const factors: string[] = [];
  let score = 0;

  // 견적 후 경과일: 30일 넘어가면 위험
  if (input.daysSinceQuote != null) {
    if (input.daysSinceQuote > 60) {
      score += 30;
      factors.push(`견적 후 ${input.daysSinceQuote}일 경과`);
    } else if (input.daysSinceQuote > 30) {
      score += 18;
      factors.push(`견적 후 ${input.daysSinceQuote}일 경과`);
    }
  }

  // 결제 성공 이력
  if (input.paymentSuccessRatio != null) {
    if (input.paymentSuccessRatio === 0) {
      score += 25;
      factors.push("과거 결제 성공 이력 없음");
    } else if (input.paymentSuccessRatio < 0.5) {
      score += 12;
      factors.push("과거 결제 성공률 낮음");
    }
  } else {
    score += 8;
    factors.push("과거 결제 이력 없음");
  }

  // 커뮤니케이션 침묵
  if (input.daysSinceContact != null) {
    if (input.daysSinceContact > 14) {
      score += 20;
      factors.push(`최근 응답 ${input.daysSinceContact}일 전`);
    } else if (input.daysSinceContact > 7) {
      score += 10;
      factors.push(`최근 응답 ${input.daysSinceContact}일 전`);
    }
  } else {
    score += 5;
    factors.push("커뮤니케이션 로그 없음");
  }

  // 카테고리 리스크
  if (HIGH_RISK_CATS.has(input.category)) {
    score += 8;
    factors.push("장기·분납 위험 카테고리");
  }

  // 미결제 인보이스
  if (input.hasUnpaidInvoice) {
    score += 15;
    factors.push("미결제 인보이스 존재");
  }

  score = Math.min(100, score);

  const recommendation =
    score >= 70
      ? "즉시 재촉 + 결제수단 안내"
      : score >= 40
      ? "3일 내 확인 연락"
      : "정상 진행 (모니터링만)";

  return { score, factors, recommendation };
}

export async function scorePaymentRisk(caseId: string): Promise<PaymentRisk | null> {
  const c = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    include: {
      inquiry: { select: { email: true, contactName: true, latestContactAt: true, intakeCategory: true } },
      quotes: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      accountingMemo: { select: { paymentStatus: true, feeAmount: true, paidAmount: true } },
    },
  });
  if (!c) return null;

  const inq = c.inquiry;

  const email = inq?.email ?? null;
  const paymentHistory = email
    ? await prisma.payment.findMany({
        where: { customerEmail: email },
        select: { status: true },
      })
    : [];

  const total = paymentHistory.length;
  const successful = paymentHistory.filter((p) => p.status === "CONFIRMED").length;
  const paymentSuccessRatio = total > 0 ? successful / total : null;

  const now = Date.now();
  const daysSinceQuote = c.quotes[0]
    ? Math.round((now - c.quotes[0].createdAt.getTime()) / (24 * 3600 * 1000))
    : null;
  const daysSinceContact = inq?.latestContactAt
    ? Math.round((now - inq.latestContactAt.getTime()) / (24 * 3600 * 1000))
    : null;

  const hasUnpaidInvoice =
    c.accountingMemo?.paymentStatus === "UNPAID" ||
    c.accountingMemo?.paymentStatus === "PARTIAL";

  const { score, factors, recommendation } = computeScore({
    daysSinceQuote,
    paymentSuccessRatio,
    daysSinceContact,
    category: c.category,
    hasUnpaidInvoice,
  });

  return {
    caseId: c.id,
    caseNo: c.caseNo,
    title: c.title,
    status: c.status,
    category: c.category,
    score,
    factors,
    recommendation,
    clientEmail: email,
    clientName: inq?.contactName ?? null,
  };
}

export async function listPaymentRisks(limit = 100): Promise<PaymentRisk[]> {
  const cases = await prisma.caseMatter.findMany({
    where: { status: { in: [...ACTIVE_STATUSES] } },
    orderBy: { updatedAt: "desc" },
    take: 500,
    select: { id: true },
  });

  const results = await Promise.all(cases.map((c) => scorePaymentRisk(c.id).catch(() => null)));
  const filtered = results.filter((r): r is PaymentRisk => r != null);
  filtered.sort((a, b) => b.score - a.score);
  return filtered.slice(0, limit);
}

/**
 * risk > 70 인 사건에 대한 워크플로 트리거 헬퍼.
 * workflow-engine 은 caller 에서 import (본 파일은 순수 계산 유지).
 */
export function shouldTriggerCollection(risk: PaymentRisk): boolean {
  return risk.score >= 70;
}
