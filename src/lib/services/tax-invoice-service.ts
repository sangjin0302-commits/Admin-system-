/**
 * 전자세금계산서 서비스 — 바로빌(Barobill) ASP + 레거시 Hometax/Wetax 폴백.
 *
 * Round Y: 바로빌 어댑터 + TaxInvoice 모델로 영속화 추가.
 *  - issueTaxInvoice(): 새 API — Payment에서 호출, DB 영속화
 *  - listTaxInvoices(), getTaxInvoiceStats(): admin UI용
 *  - 기존 issueInvoice/listRecentInvoices는 backward compat 유지 (in-memory)
 *
 * 환경변수 (바로빌):
 *   BAROBILL_API_KEY, BAROBILL_CORP_NUM, BAROBILL_USER_ID, BAROBILL_BASE_URL
 *
 * 환경변수 (legacy):
 *   HOMETAX_API_KEY, WETAX_API_KEY
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

const VAT_RATE = 0.1;

// ===========================================================================
// Round Y — Barobill adapter + DB persistence
// ===========================================================================

export interface IssueTaxInvoiceInput {
  paymentId?: string;
  caseId?: string;
  totalAmount: number;                   // 부가세 포함 합계
  customerName: string;
  customerEmail?: string;
  customerBusinessNo?: string;
  itemName: string;
}

function getBarobillConfig() {
  const apiKey = process.env.BAROBILL_API_KEY?.trim();
  const corpNum = process.env.BAROBILL_CORP_NUM?.trim();
  const userId = process.env.BAROBILL_USER_ID?.trim();
  const baseUrl =
    process.env.BAROBILL_BASE_URL?.trim() || "https://ws.baroservice.com";
  if (!apiKey || !corpNum || !userId) return null;
  // SSRF 방어: https 또는 localhost만 허용
  if (!baseUrl.startsWith("https://") && !baseUrl.startsWith("http://localhost") && !baseUrl.startsWith("http://127.")) {
    return null;
  }
  return { apiKey, corpNum, userId, baseUrl };
}

export function isTaxInvoiceConnected(): boolean {
  return getBarobillConfig() !== null;
}

function splitVat(total: number): { supply: number; tax: number } {
  const supply = Math.round(total / (1 + VAT_RATE));
  const tax = total - supply;
  return { supply, tax };
}

function generateMgtKey(prefix = "INV"): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rand}`.toUpperCase();
}

export async function issueTaxInvoice(
  input: IssueTaxInvoiceInput
): Promise<{ ok: boolean; invoiceId: string; status: string; error?: string }> {
  const { supply, tax } = splitVat(input.totalAmount);
  const mgtKey = generateMgtKey();

  const draft = await prisma.taxInvoice.create({
    data: {
      paymentId: input.paymentId,
      caseId: input.caseId,
      supplyAmount: supply,
      taxAmount: tax,
      totalAmount: input.totalAmount,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerBusinessNo: input.customerBusinessNo,
      itemName: input.itemName,
      providerType: "BAROBILL",
      providerId: mgtKey,
      status: "DRAFT",
    },
  });

  const cfg = getBarobillConfig();
  if (!cfg) {
    logger.warn("[tax-invoice] BAROBILL 미설정 — DRAFT만 저장");
    return { ok: true, invoiceId: draft.id, status: "DRAFT" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/api/v1/TaxInvoice/Issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
        "X-API-User": cfg.userId,
      },
      body: JSON.stringify({
        CorpNum: cfg.corpNum,
        MgtKey: mgtKey,
        TaxInvoice: {
          issueType: "정발행",
          purposeType: input.customerBusinessNo ? "영수" : "청구",
          taxType: "과세",
          invoicerCorpNum: cfg.corpNum,
          invoiceeType: input.customerBusinessNo ? "사업자" : "개인",
          invoiceeCorpNum: input.customerBusinessNo,
          invoiceeName: input.customerName,
          invoiceeEmail1: input.customerEmail,
          supplyCostTotal: supply,
          taxTotal: tax,
          totalAmount: input.totalAmount,
          detailList: [
            {
              itemName: input.itemName,
              qty: 1,
              unitCost: supply,
              supplyCost: supply,
              tax,
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("[tax-invoice] Barobill error", res.status, body);
      captureError(new Error(`Barobill ${res.status}`), { body, mgtKey });
      await prisma.taxInvoice.update({
        where: { id: draft.id },
        data: {
          status: "FAILED",
          errorMessage: `${res.status}: ${body.slice(0, 200)}`,
        },
      });
      return { ok: false, invoiceId: draft.id, status: "FAILED", error: body };
    }

    const data = await res.json();
    const ntsConfirmNum: string | undefined =
      data?.NTSConfirmNum ?? data?.ntsConfirmNum;
    const invoiceNumber: string | undefined =
      data?.InvoiceNum ?? data?.invoiceNumber;

    await prisma.taxInvoice.update({
      where: { id: draft.id },
      data: {
        status: "ISSUED",
        invoiceNumber: invoiceNumber ?? null,
        ntsConfirmNum: ntsConfirmNum ?? null,
        issuedAt: new Date(),
        rawProviderJson: JSON.stringify(data).slice(0, 4000),
      },
    });
    return { ok: true, invoiceId: draft.id, status: "ISSUED" };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    await prisma.taxInvoice.update({
      where: { id: draft.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      ok: false,
      invoiceId: draft.id,
      status: "FAILED",
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function listTaxInvoices(limit = 100) {
  try {
    return await prisma.taxInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}

export async function getTaxInvoiceStats() {
  try {
    const rows = await prisma.taxInvoice.groupBy({
      by: ["status"],
      _count: true,
      _sum: { totalAmount: true },
    });
    return Object.fromEntries(
      rows.map((r) => [
        r.status,
        { count: r._count, total: Number(r._sum.totalAmount ?? 0) },
      ])
    );
  } catch {
    return {};
  }
}

// ===========================================================================
// Legacy in-memory shim (backward compat — 기존 admin UI 호출 유지)
// ===========================================================================

export type TaxInvoiceRequest = {
  caseId: string;
  clientName: string;
  clientBizNo: string;
  amount: number;
  itemDescription: string;
};

export type TaxInvoiceResult = {
  invoiceId: string;
  status: "issued" | "pending" | "failed";
  xmlPayload?: string;
  issuedAt: Date;
};

const HOMETAX_KEY = process.env.HOMETAX_API_KEY;
const WETAX_KEY = process.env.WETAX_API_KEY;

const memoryStore: TaxInvoiceResult[] = [];

function buildXmlPayload(req: TaxInvoiceRequest, invoiceId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<TaxInvoice>
  <InvoiceId>${invoiceId}</InvoiceId>
  <CaseId>${req.caseId}</CaseId>
  <Client>
    <Name>${req.clientName}</Name>
    <BizNo>${req.clientBizNo}</BizNo>
  </Client>
  <Item>${req.itemDescription}</Item>
  <Amount>${req.amount}</Amount>
</TaxInvoice>`;
}

export async function issueInvoice(
  req: TaxInvoiceRequest
): Promise<TaxInvoiceResult> {
  // 바로빌 활성 시 새 어댑터로 위임
  if (isTaxInvoiceConnected()) {
    const r = await issueTaxInvoice({
      caseId: req.caseId,
      totalAmount: req.amount,
      customerName: req.clientName,
      customerBusinessNo: req.clientBizNo,
      itemName: req.itemDescription,
    });
    return {
      invoiceId: r.invoiceId,
      status: r.status === "ISSUED" ? "issued" : r.status === "FAILED" ? "failed" : "pending",
      issuedAt: new Date(),
    };
  }

  const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
  const xmlPayload = buildXmlPayload(req, invoiceId);
  let status: TaxInvoiceResult["status"] = "issued";

  if (HOMETAX_KEY || WETAX_KEY) {
    try {
      const apiKey = HOMETAX_KEY ?? WETAX_KEY!;
      const res = await fetch("https://teht.hometax.go.kr/api/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          Authorization: `Bearer ${apiKey}`,
        },
        body: xmlPayload,
      }).catch(() => null);
      if (!res || !res.ok) status = "pending";
    } catch {
      status = "failed";
    }
  } else {
    logger.debug("[tax-invoice:mock] issued", invoiceId);
  }

  const result: TaxInvoiceResult = { invoiceId, status, xmlPayload, issuedAt: new Date() };
  memoryStore.unshift(result);
  return result;
}

export async function getInvoiceStatus(invoiceId: string): Promise<string> {
  const found = memoryStore.find((r) => r.invoiceId === invoiceId);
  return found?.status ?? "unknown";
}

export async function listRecentInvoices(limit = 20): Promise<TaxInvoiceResult[]> {
  return memoryStore.slice(0, limit);
}
