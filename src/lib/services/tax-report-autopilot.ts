/**
 * 자동 세금 신고 봇 — 월말 부가세 / 종합소득세 초안 자동 생성.
 *
 * 흐름: 지난 달 CONFIRMED Payment 집계 → 부가세 신고 draft + 종합소득세 예상 draft
 *       → hometax queue (설정 있으면) 또는 수동 대기열
 *       → 관리자 이메일 요약
 *
 * 저장:
 *   - "tax_autopilot.config"     — 자동 제출 임계값
 *   - "tax_autopilot.reports"    — 최근 생성된 리포트 (최대 24개월)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { queueTaxInvoice } from "@/lib/services/hometax-integration-service";

const CONFIG_KEY = "tax_autopilot.config";
const REPORTS_KEY = "tax_autopilot.reports";
const MAX_REPORTS = 24;

export type TaxReport = {
  id: string;
  year: number;
  month: number;
  generatedAt: string;
  vatDraft: {
    totalSales: number;
    outputVat: number; // 매출세액 (10%)
    invoiceCount: number;
  };
  incomeDraft: {
    totalRevenue: number;
    estimatedNetIncome: number;
    estimatedIncomeTax: number;
  };
  submission: {
    autoSubmitted: boolean;
    queuedForManual: boolean;
    note: string;
  };
  approvalStatus: "pending" | "approved" | "rejected";
};

export type TaxAutopilotConfig = {
  autoSubmitThresholdKrw: number; // 이 금액 이하면 자동 큐 제출, 초과면 수동
  incomeExpenseRatio: number;     // 예상 경비율 (0-1)
  incomeTaxRate: number;           // 예상 소득세율 (0-1)
  notifyEmail?: string;
};

const DEFAULT_CONFIG: TaxAutopilotConfig = {
  autoSubmitThresholdKrw: 50_000_000,
  incomeExpenseRatio: 0.4,
  incomeTaxRate: 0.24,
};

export async function getTaxAutopilotConfig(): Promise<TaxAutopilotConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CONFIG_KEY } });
    if (!row?.value) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(row.value) as Partial<TaxAutopilotConfig>;
    return {
      autoSubmitThresholdKrw: typeof parsed.autoSubmitThresholdKrw === "number" ? parsed.autoSubmitThresholdKrw : DEFAULT_CONFIG.autoSubmitThresholdKrw,
      incomeExpenseRatio: typeof parsed.incomeExpenseRatio === "number" ? parsed.incomeExpenseRatio : DEFAULT_CONFIG.incomeExpenseRatio,
      incomeTaxRate: typeof parsed.incomeTaxRate === "number" ? parsed.incomeTaxRate : DEFAULT_CONFIG.incomeTaxRate,
      notifyEmail: typeof parsed.notifyEmail === "string" ? parsed.notifyEmail : undefined,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function setTaxAutopilotConfig(cfg: TaxAutopilotConfig): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(cfg) },
    update: { value: JSON.stringify(cfg) },
  });
}

export async function getRecentReports(limit = 12): Promise<TaxReport[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: REPORTS_KEY } });
    if (!row?.value) return [];
    const arr = JSON.parse(row.value) as TaxReport[];
    return Array.isArray(arr) ? arr.slice(0, limit) : [];
  } catch {
    return [];
  }
}

async function saveReport(report: TaxReport): Promise<void> {
  const row = await prisma.siteSetting.findUnique({ where: { key: REPORTS_KEY } });
  const arr: TaxReport[] = row?.value ? (JSON.parse(row.value) as TaxReport[]) : [];
  // Replace existing report for same year/month if present
  const filtered = arr.filter((r) => !(r.year === report.year && r.month === report.month));
  const next = [report, ...filtered].slice(0, MAX_REPORTS);
  await prisma.siteSetting.upsert({
    where: { key: REPORTS_KEY },
    create: { key: REPORTS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
}

export async function setReportApproval(reportId: string, status: "approved" | "rejected"): Promise<TaxReport | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: REPORTS_KEY } });
  if (!row?.value) return null;
  const arr = JSON.parse(row.value) as TaxReport[];
  const idx = arr.findIndex((r) => r.id === reportId);
  if (idx < 0) return null;
  arr[idx] = { ...arr[idx], approvalStatus: status };
  await prisma.siteSetting.upsert({
    where: { key: REPORTS_KEY },
    create: { key: REPORTS_KEY, value: JSON.stringify(arr) },
    update: { value: JSON.stringify(arr) },
  });
  return arr[idx];
}

/**
 * 지정 연월(기본: 지난 달)의 세금 리포트 생성.
 */
export async function generateTaxReportForMonth(year?: number, month?: number): Promise<TaxReport> {
  const cfg = await getTaxAutopilotConfig();
  const now = new Date();
  const y = year ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const m = month ?? (now.getMonth() === 0 ? 12 : now.getMonth()); // 지난 달 (1-12)
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const payments = await prisma.payment.findMany({
    where: { status: "CONFIRMED", approvedAt: { gte: start, lt: end } },
    select: { id: true, amount: true, caseId: true, customerName: true, customerEmail: true, orderName: true, approvedAt: true },
  });

  const totalSales = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const outputVat = Math.round(totalSales * 0.1 / 1.1); // 부가세 포함가 가정 → 10/110
  const invoiceCount = payments.length;

  const totalRevenue = totalSales - outputVat;
  const estimatedNetIncome = Math.round(totalRevenue * (1 - cfg.incomeExpenseRatio));
  const estimatedIncomeTax = Math.round(estimatedNetIncome * cfg.incomeTaxRate);

  const shouldAutoSubmit = totalSales > 0 && totalSales <= cfg.autoSubmitThresholdKrw;
  let autoSubmitted = false;
  let queuedForManual = false;
  let note = "";

  if (shouldAutoSubmit) {
    try {
      // Queue synthetic aggregate tax invoice to hometax queue
      await queueTaxInvoice({
        buyerBizNo: "AGGREGATE",
        buyerName: `${y}-${String(m).padStart(2, "0")} 매출 집계`,
        amount: totalSales,
        itemName: `${y}년 ${m}월 부가세 신고 초안 집계`,
      });
      autoSubmitted = true;
      note = "hometax 큐로 자동 제출됨";
    } catch (err) {
      queuedForManual = true;
      note = `자동 제출 실패 - 수동 대기열: ${err instanceof Error ? err.message : String(err)}`;
      logger.warn("[tax-autopilot] queue 실패", err);
    }
  } else {
    queuedForManual = true;
    note = totalSales === 0 ? "매출 없음" : `임계값 초과(${cfg.autoSubmitThresholdKrw.toLocaleString()}원) - 수동 검토 필요`;
  }

  const report: TaxReport = {
    id: `tax_${y}_${String(m).padStart(2, "0")}_${Date.now().toString(36)}`,
    year: y,
    month: m,
    generatedAt: new Date().toISOString(),
    vatDraft: { totalSales, outputVat, invoiceCount },
    incomeDraft: { totalRevenue, estimatedNetIncome, estimatedIncomeTax },
    submission: { autoSubmitted, queuedForManual, note },
    approvalStatus: "pending",
  };

  await saveReport(report);

  // Admin summary email
  if (cfg.notifyEmail) {
    try {
      const mod = await import("@/lib/services/email-notification-service").catch(() => null);
      const send = mod as unknown as { sendPlainEmail?: (a: { to: string; subject: string; body: string }) => Promise<unknown> } | null;
      if (send?.sendPlainEmail) {
        const body = `${y}년 ${m}월 세금 신고 초안이 생성되었습니다.\n\n` +
          `매출 합계: ${totalSales.toLocaleString()}원\n` +
          `부가세 매출세액: ${outputVat.toLocaleString()}원\n` +
          `종합소득세 예상: ${estimatedIncomeTax.toLocaleString()}원\n` +
          `발행 건수: ${invoiceCount}건\n\n` +
          `상태: ${autoSubmitted ? "hometax 큐로 자동 제출" : "수동 검토 대기"}\n${note}\n\n` +
          `승인/거부: /admin/finance/tax-autopilot`;
        await send.sendPlainEmail({ to: cfg.notifyEmail, subject: `[세금 자동봇] ${y}-${m} 신고 초안`, body }).catch(() => undefined);
      }
    } catch (err) {
      logger.warn("[tax-autopilot] 관리자 이메일 실패", err);
    }
  }

  return report;
}
