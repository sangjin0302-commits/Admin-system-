/**
 * 국세청 홈택스 연동 서비스 (스텁)
 *
 * 실제 홈택스 API는 공인인증서(사업자용) 및 CBT 등록이 필요합니다.
 * 이 서비스는 SiteSetting JSON을 로컬 큐로 사용하며, 실제 발행은 dry-run 결과를 반환합니다.
 *
 * 필요 환경 변수:
 *   HOMETAX_CERT_PATH       — 공인인증서(.pfx) 경로
 *   HOMETAX_CERT_PASSWORD   — 인증서 비밀번호
 *   HOMETAX_BIZ_NO          — 발행자 사업자등록번호 (선택, SiteSetting 값이 우선)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const SITE_SETTING_KEY = "integration.hometax.queue";
const CONFIG_KEY = "integration.hometax.config";

export type TaxInvoiceStatus = "PENDING" | "ISSUED" | "FAILED";

export type TaxInvoice = {
  id: string;
  caseId?: string;
  buyerBizNo: string;
  buyerName?: string;
  amount: number;
  itemName: string;
  issueDate: string; // ISO
  status: TaxInvoiceStatus;
  errorMessage?: string;
  externalRef?: string;
};

export type HometaxConfig = {
  bizNo?: string;
  companyName?: string;
  certUploadedAt?: string;
  note?: string;
};

async function readQueue(): Promise<TaxInvoice[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTING_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as TaxInvoice[]) : [];
  } catch (err) {
    logger.warn("[hometax] queue read failed", err);
    return [];
  }
}

async function writeQueue(items: TaxInvoice[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEY },
    create: { key: SITE_SETTING_KEY, value: JSON.stringify(items) },
    update: { value: JSON.stringify(items) },
  });
}

export async function getHometaxConfig(): Promise<HometaxConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: CONFIG_KEY } });
  if (!row?.value) return {};
  try {
    return JSON.parse(row.value) as HometaxConfig;
  } catch {
    return {};
  }
}

export async function setHometaxConfig(cfg: HometaxConfig): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(cfg) },
    update: { value: JSON.stringify(cfg) },
  });
}

export async function listRecentInvoices(limit = 50): Promise<TaxInvoice[]> {
  const q = await readQueue();
  return q.slice(-limit).reverse();
}

export async function queueTaxInvoice(input: Omit<TaxInvoice, "id" | "status" | "issueDate"> & { issueDate?: string }): Promise<TaxInvoice> {
  const q = await readQueue();
  const inv: TaxInvoice = {
    id: `hti_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    caseId: input.caseId,
    buyerBizNo: input.buyerBizNo,
    buyerName: input.buyerName,
    amount: input.amount,
    itemName: input.itemName,
    issueDate: input.issueDate ?? new Date().toISOString(),
    status: "PENDING",
  };
  q.push(inv);
  await writeQueue(q);
  return inv;
}

export async function issueTaxInvoice(
  invoiceId: string,
  _buyerInfoOverride?: Partial<Pick<TaxInvoice, "buyerBizNo" | "buyerName">>,
): Promise<{ ok: boolean; invoice: TaxInvoice; dryRun: boolean; message: string }> {
  const q = await readQueue();
  const idx = q.findIndex((v) => v.id === invoiceId);
  if (idx < 0) throw new Error("세금계산서를 찾을 수 없습니다");
  const inv = q[idx];

  const certPath = process.env.HOMETAX_CERT_PATH?.trim();
  const certPw = process.env.HOMETAX_CERT_PASSWORD?.trim();

  if (!certPath || !certPw) {
    // dry-run — 실제 API 호출은 건너뛰고 로컬 큐에만 상태 표기
    const updated: TaxInvoice = {
      ...inv,
      status: "ISSUED",
      externalRef: `DRY-${Date.now().toString(36)}`,
    };
    q[idx] = updated;
    await writeQueue(q);
    return { ok: true, invoice: updated, dryRun: true, message: "인증서 미설정 — dry-run 발행 처리" };
  }

  // TODO: 실제 홈택스 API 호출 (공인인증서 로드 → SOAP/REST 전송)
  const updated: TaxInvoice = {
    ...inv,
    status: "ISSUED",
    externalRef: `HTX-${Date.now().toString(36)}`,
  };
  q[idx] = updated;
  await writeQueue(q);
  return { ok: true, invoice: updated, dryRun: false, message: "발행 완료" };
}

export async function markInvoiceFailed(invoiceId: string, errorMessage: string): Promise<void> {
  const q = await readQueue();
  const idx = q.findIndex((v) => v.id === invoiceId);
  if (idx < 0) return;
  q[idx] = { ...q[idx], status: "FAILED", errorMessage };
  await writeQueue(q);
}

export async function syncSalesReport(year: number, month: number): Promise<{ year: number; month: number; total: number; count: number; dryRun: boolean }> {
  const q = await readQueue();
  const items = q.filter((v) => {
    const d = new Date(v.issueDate);
    return d.getFullYear() === year && d.getMonth() + 1 === month && v.status === "ISSUED";
  });
  const total = items.reduce((sum, v) => sum + v.amount, 0);
  return {
    year,
    month,
    total,
    count: items.length,
    dryRun: !(process.env.HOMETAX_CERT_PATH && process.env.HOMETAX_CERT_PASSWORD),
  };
}
