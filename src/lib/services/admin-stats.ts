/**
 * 관리자 통계 — 월별 사건/매출/카테고리 분포.
 * 차트 라이브러리 없이 단순 집계.
 */

import { prisma } from "@/lib/prisma/client";

const MONTHS_LOOKBACK = 12;

export type MonthlyCount = {
  month: string;     // "2026-06"
  newInquiries: number;
  newCases: number;
  closedCases: number;
  revenueWon: number;  // 입금 완료 금액
};

export type CategoryCount = {
  category: string;
  label: string;
  total: number;
  active: number;
  closed: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  VISA_STAY: "비자/체류",
  ADMIN_APPEAL: "행정심판",
  CONTRACT_INVESTIGATION: "계약서/사실조사",
  LICENSE_PERMIT: "인허가",
  OTHER: "기타"
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function buildMonthlyStats(): Promise<MonthlyCount[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (MONTHS_LOOKBACK - 1), 1);

  const [inquiries, cases, accounting] = await Promise.all([
    prisma.inquiry.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true }
    }),
    prisma.caseMatter.findMany({
      where: { OR: [{ createdAt: { gte: start } }, { closedAt: { gte: start } }] },
      select: { createdAt: true, closedAt: true, status: true }
    }),
    prisma.caseAccountingMemo.findMany({
      where: { paidAt: { gte: start }, paymentStatus: "PAID" },
      select: { paidAt: true, paidAmount: true }
    })
  ]);

  const buckets = new Map<string, MonthlyCount>();
  for (let i = 0; i < MONTHS_LOOKBACK; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = monthKey(d);
    buckets.set(key, { month: key, newInquiries: 0, newCases: 0, closedCases: 0, revenueWon: 0 });
  }

  for (const r of inquiries) {
    const k = monthKey(r.createdAt);
    const b = buckets.get(k);
    if (b) b.newInquiries += 1;
  }
  for (const r of cases) {
    const ck = monthKey(r.createdAt);
    const cb = buckets.get(ck);
    if (cb) cb.newCases += 1;
    if (r.closedAt) {
      const xk = monthKey(r.closedAt);
      const xb = buckets.get(xk);
      if (xb) xb.closedCases += 1;
    }
  }
  for (const r of accounting) {
    if (!r.paidAt) continue;
    const k = monthKey(r.paidAt);
    const b = buckets.get(k);
    if (b && r.paidAmount) b.revenueWon += r.paidAmount;
  }

  return Array.from(buckets.values());
}

export async function buildCategoryStats(): Promise<CategoryCount[]> {
  const cases = await prisma.caseMatter.findMany({
    select: { category: true, status: true }
  });
  const map = new Map<string, CategoryCount>();
  for (const cat of Object.keys(CATEGORY_LABELS)) {
    map.set(cat, { category: cat, label: CATEGORY_LABELS[cat], total: 0, active: 0, closed: 0 });
  }
  for (const c of cases) {
    const key = c.category ?? "OTHER";
    const entry = map.get(key) ?? map.get("OTHER")!;
    entry.total += 1;
    if (c.status === "CLOSED" || c.status === "CANCELLED") entry.closed += 1;
    else entry.active += 1;
  }
  return Array.from(map.values());
}

export async function buildAccountingSummary() {
  const memos = await prisma.caseAccountingMemo.findMany({
    select: { feeAmount: true, paidAmount: true, feeStatus: true, paymentStatus: true }
  });
  const result = {
    feeTotal: 0,         // 견적 합계
    paidTotal: 0,        // 입금 합계
    unpaidCount: 0,
    paidCount: 0,
    partialCount: 0
  };
  for (const m of memos) {
    if (m.feeAmount) result.feeTotal += m.feeAmount;
    if (m.paidAmount) result.paidTotal += m.paidAmount;
    if (m.paymentStatus === "UNPAID") result.unpaidCount += 1;
    if (m.paymentStatus === "PAID") result.paidCount += 1;
    if (m.paymentStatus === "PARTIAL") result.partialCount += 1;
  }
  return result;
}
