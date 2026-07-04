/**
 * 월간 재무 리포트 집계 서비스.
 *
 * 데이터 소스:
 *   - Payment (수임 결제, CONFIRMED = 매출 인식)
 *   - Payment (REQUESTED/status 미확정 = 미수금 후보)
 *   - Payment (CANCELED/PARTIAL_CANCELED = 환불)
 *   - Inquiry (건수 지표)
 *   - FeeItem (예상 매출 참고 — amount는 자유 문자열이라 카테고리 카운트만 사용)
 *
 * 세금 추정 (대략치):
 *   부가세 ≈ revenue * 0.033   (실제는 10% 매출세이지만 필드 이슈 회피용 대략치)
 *   예상 소득세 ≈ revenue * 0.06
 *   → 총 세금 ≈ revenue * 0.093
 *
 * 주의: 이 세금 추정은 대략치이며 실제 신고와 다를 수 있음. 회계사 검토 필요.
 */

import { prisma } from "@/lib/prisma/client";

export interface MonthlyReport {
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  revenue: number;
  paymentCount: number;
  unpaid: number;
  unpaidCount: number;
  refunds: number;
  refundCount: number;
  taxEstimate: {
    vat: number;
    incomeTax: number;
    total: number;
    note: string;
  };
  netIncome: number;
  inquiryCount: number;
  byCategory: Array<{ category: string; revenue: number; count: number }>;
  byService: Array<{ service: string; revenue: number; count: number }>;
}

export interface YearToDateReport {
  year: number;
  revenue: number;
  unpaid: number;
  refunds: number;
  netIncome: number;
  taxEstimate: number;
  monthlyTrend: Array<{ month: number; revenue: number; net: number }>;
}

const VAT_RATE = 0.033; // 대략치
const INCOME_TAX_RATE = 0.06; // 대략치
const TAX_NOTE = "부가세 3.3% + 예상 소득세 6% = 총 9.3% (대략치, 회계사 검토 필요)";

function monthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}

function inferCategory(orderName: string, caseIdCategory: string | null): string {
  if (caseIdCategory) return caseIdCategory;
  const n = orderName.toUpperCase();
  if (n.includes("VISA") || n.includes("비자") || n.includes("체류")) return "VISA_STAY";
  if (n.includes("이의") || n.includes("APPEAL") || n.includes("행정심판")) return "ADMIN_APPEAL";
  if (n.includes("계약") || n.includes("CONTRACT")) return "CONTRACT_INVESTIGATION";
  if (n.includes("허가") || n.includes("LICENSE") || n.includes("PERMIT")) return "LICENSE_PERMIT";
  return "OTHER";
}

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  const { start, end } = monthRange(year, month);

  const payments = await prisma.payment
    .findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: {
        id: true,
        amount: true,
        status: true,
        orderName: true,
        caseId: true,
        approvedAt: true,
        canceledAt: true,
      },
    })
    .catch(() => []);

  const confirmed = payments.filter((p) => p.status === "CONFIRMED");
  const requested = payments.filter((p) => p.status === "REQUESTED");
  const canceled = payments.filter((p) => p.status === "CANCELED" || p.status === "PARTIAL_CANCELED");

  const revenue = confirmed.reduce((s, p) => s + (p.amount ?? 0), 0);
  const unpaid = requested.reduce((s, p) => s + (p.amount ?? 0), 0);
  const refunds = canceled.reduce((s, p) => s + (p.amount ?? 0), 0);

  // 카테고리 매핑 위해 caseId → category 조회
  const caseIds = Array.from(new Set(confirmed.map((p) => p.caseId).filter((v): v is string => Boolean(v))));
  const cases = caseIds.length
    ? await prisma.caseMatter
        .findMany({ where: { id: { in: caseIds } }, select: { id: true, category: true, matterType: true } })
        .catch(() => [])
    : [];
  const caseCategoryMap = new Map(cases.map((c) => [c.id, c.category] as const));
  const caseServiceMap = new Map(cases.map((c) => [c.id, c.matterType] as const));

  const categoryAgg = new Map<string, { revenue: number; count: number }>();
  const serviceAgg = new Map<string, { revenue: number; count: number }>();
  for (const p of confirmed) {
    const cat = inferCategory(p.orderName, p.caseId ? caseCategoryMap.get(p.caseId) ?? null : null);
    const svc = (p.caseId ? caseServiceMap.get(p.caseId) : null) ?? p.orderName ?? "기타";
    const c = categoryAgg.get(cat) ?? { revenue: 0, count: 0 };
    c.revenue += p.amount ?? 0;
    c.count++;
    categoryAgg.set(cat, c);
    const s = serviceAgg.get(svc) ?? { revenue: 0, count: 0 };
    s.revenue += p.amount ?? 0;
    s.count++;
    serviceAgg.set(svc, s);
  }

  const inquiryCount = await prisma.inquiry
    .count({ where: { createdAt: { gte: start, lt: end } } })
    .catch(() => 0);

  const vat = Math.round(revenue * VAT_RATE);
  const incomeTax = Math.round(revenue * INCOME_TAX_RATE);
  const totalTax = vat + incomeTax;
  const netIncome = revenue - refunds - totalTax;

  return {
    year,
    month,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    revenue,
    paymentCount: confirmed.length,
    unpaid,
    unpaidCount: requested.length,
    refunds,
    refundCount: canceled.length,
    taxEstimate: { vat, incomeTax, total: totalTax, note: TAX_NOTE },
    netIncome,
    inquiryCount,
    byCategory: Array.from(categoryAgg.entries())
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    byService: Array.from(serviceAgg.entries())
      .map(([service, v]) => ({ service, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
  };
}

export async function getYearToDate(year: number): Promise<YearToDateReport> {
  const now = new Date();
  const currentMonth = now.getUTCFullYear() === year ? now.getUTCMonth() + 1 : 12;
  const monthlyTrend: Array<{ month: number; revenue: number; net: number }> = [];
  let revenue = 0;
  let unpaid = 0;
  let refunds = 0;
  let netIncome = 0;
  let taxEstimate = 0;
  for (let m = 1; m <= currentMonth; m++) {
    const r = await getMonthlyReport(year, m);
    revenue += r.revenue;
    unpaid += r.unpaid;
    refunds += r.refunds;
    netIncome += r.netIncome;
    taxEstimate += r.taxEstimate.total;
    monthlyTrend.push({ month: m, revenue: r.revenue, net: r.netIncome });
  }
  return { year, revenue, unpaid, refunds, netIncome, taxEstimate, monthlyTrend };
}

export async function getLast12MonthsTrend(): Promise<Array<{ year: number; month: number; revenue: number; net: number }>> {
  const now = new Date();
  const out: Array<{ year: number; month: number; revenue: number; net: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const r = await getMonthlyReport(y, m);
    out.push({ year: y, month: m, revenue: r.revenue, net: r.netIncome });
  }
  return out;
}
