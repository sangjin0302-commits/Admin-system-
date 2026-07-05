/**
 * 은행 거래내역 자동 매칭 서비스 (스텁)
 *
 * CSV 업로드된 은행 거래내역을 미수금(Quote/Payment)에 매칭합니다.
 * 실제 은행 API는 오픈뱅킹 공동 표준 또는 각 은행 오픈 API를 통해 실시간 조회할 수 있으나,
 * 여기서는 CSV 파싱 + fuzzy match 로컬 처리를 제공합니다.
 *
 * 필요 환경 변수:
 *   KB_OPEN_BANKING_API_KEY   — KB 국민은행 오픈뱅킹
 *   SHINHAN_OPEN_API_KEY      — 신한은행 오픈 API
 *   OPEN_BANKING_CLIENT_ID    — 오픈뱅킹공동 API (금융결제원) 클라이언트 ID
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const IMPORT_HISTORY_KEY = "integration.bank.import_history";

export type BankTransaction = {
  txId: string;
  date: string; // ISO
  amount: number;
  memo: string;
  matched: boolean;
  caseId?: string;
  matchScore?: number;
  matchReason?: string;
};

export type BankCandidate = {
  caseId: string;
  caseNo: string | null;
  title: string;
  clientName?: string | null;
  outstandingAmount: number;
};

export type ImportResult = {
  importedAt: string;
  fileName?: string;
  provider: "KB" | "SHINHAN" | "GENERIC";
  totalRows: number;
  matched: number;
  transactions: BankTransaction[];
};

const KOREAN_NUM_RE = /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/;

function parseAmount(v: string): number {
  const trimmed = v.replace(/[^-\d.,]/g, "").trim();
  if (!KOREAN_NUM_RE.test(trimmed)) return 0;
  return Number(trimmed.replace(/,/g, "")) || 0;
}

function parseDate(v: string): string {
  const s = v.trim().replace(/\./g, "-").replace(/\//g, "-");
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

/**
 * CSV → BankTransaction[] 파싱.
 * 간단한 CSV 파서 (따옴표 감안 미지원 — 은행 export가 표준 CSV라고 가정).
 * 컬럼 자동 감지: 날짜/거래일자, 금액/입금액, 적요/메모/내용
 */
export function parseCsv(csv: string): BankTransaction[] {
  const lines = csv.split(/\r?\n/).filter((v) => v.trim().length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dateIdx = header.findIndex((h) => /date|일자|날짜/.test(h));
  const amountIdx = header.findIndex((h) => /amount|금액|입금|deposit/.test(h));
  const memoIdx = header.findIndex((h) => /memo|적요|내용|desc|note/.test(h));

  const out: BankTransaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const amount = amountIdx >= 0 ? parseAmount(cols[amountIdx] ?? "") : 0;
    if (amount <= 0) continue; // 출금 무시
    const memo = memoIdx >= 0 ? (cols[memoIdx] ?? "").trim() : "";
    const date = dateIdx >= 0 ? parseDate(cols[dateIdx] ?? "") : new Date().toISOString();
    out.push({
      txId: `tx_${Date.now().toString(36)}_${i}`,
      date,
      amount,
      memo,
      matched: false,
    });
  }
  return out;
}

/**
 * fuzzy match: 메모가 사건번호를 포함하거나 (사건번호/의뢰인명 + 금액 일치) 시 매칭.
 */
export function autoMatchTransactions(
  txs: BankTransaction[],
  candidates: BankCandidate[],
): BankTransaction[] {
  return txs.map((tx) => {
    let best: { c: BankCandidate; score: number; reason: string } | null = null;
    const memoNorm = tx.memo.replace(/\s+/g, "").toLowerCase();
    for (const c of candidates) {
      let score = 0;
      const reasons: string[] = [];
      if (c.caseNo && memoNorm.includes(c.caseNo.replace(/\s+/g, "").toLowerCase())) {
        score += 60;
        reasons.push("사건번호 일치");
      }
      if (c.clientName) {
        const nameNorm = c.clientName.replace(/\s+/g, "").toLowerCase();
        if (nameNorm.length >= 2 && memoNorm.includes(nameNorm)) {
          score += 30;
          reasons.push("의뢰인명 일치");
        }
      }
      if (Math.abs(c.outstandingAmount - tx.amount) < 1) {
        score += 20;
        reasons.push("금액 일치");
      }
      if (score >= 50 && (!best || score > best.score)) {
        best = { c, score, reason: reasons.join(" · ") };
      }
    }
    if (best) {
      return { ...tx, matched: true, caseId: best.c.caseId, matchScore: best.score, matchReason: best.reason };
    }
    return tx;
  });
}

export async function importTransactions(
  csv: string,
  opts: { fileName?: string; provider?: "KB" | "SHINHAN" | "GENERIC" } = {},
): Promise<ImportResult> {
  const txs = parseCsv(csv);
  const candidates = await loadCandidates();
  const matched = autoMatchTransactions(txs, candidates);
  const result: ImportResult = {
    importedAt: new Date().toISOString(),
    fileName: opts.fileName,
    provider: opts.provider ?? "GENERIC",
    totalRows: matched.length,
    matched: matched.filter((v) => v.matched).length,
    transactions: matched,
  };
  await appendHistory(result);
  return result;
}

async function loadCandidates(): Promise<BankCandidate[]> {
  try {
    const cases = await prisma.caseMatter.findMany({
      where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
      include: {
        parties: { select: { name: true }, take: 1 },
        quotes: {
          where: { status: { in: ["SENT", "ACCEPTED"] } },
          select: { totalMin: true, totalMax: true },
        },
      },
      take: 500,
    });
    return cases.map((c) => ({
      caseId: c.id,
      caseNo: c.caseNo,
      title: c.title,
      clientName: c.parties[0]?.name ?? null,
      outstandingAmount: c.quotes.reduce(
        (sum: number, q: { totalMin: number; totalMax: number }) =>
          sum + Number(q.totalMax ?? q.totalMin ?? 0),
        0,
      ),
    }));
  } catch (err) {
    logger.warn("[bank-matcher] candidate load failed", err);
    return [];
  }
}

async function appendHistory(result: ImportResult): Promise<void> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: IMPORT_HISTORY_KEY } });
    const arr: ImportResult[] = row?.value ? (JSON.parse(row.value) as ImportResult[]) : [];
    arr.push({ ...result, transactions: result.transactions.slice(0, 200) }); // 저장 크기 제한
    const trimmed = arr.slice(-20);
    await prisma.siteSetting.upsert({
      where: { key: IMPORT_HISTORY_KEY },
      create: { key: IMPORT_HISTORY_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    });
  } catch (err) {
    logger.warn("[bank-matcher] history append failed", err);
  }
}

export async function listImportHistory(): Promise<ImportResult[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: IMPORT_HISTORY_KEY } });
  if (!row?.value) return [];
  try {
    const arr = JSON.parse(row.value) as ImportResult[];
    return Array.isArray(arr) ? arr.slice().reverse() : [];
  } catch {
    return [];
  }
}

export async function loadCandidatesPublic(): Promise<BankCandidate[]> {
  return loadCandidates();
}

export function getProviderStatus(): { kb: boolean; shinhan: boolean; openBanking: boolean } {
  return {
    kb: Boolean(process.env.KB_OPEN_BANKING_API_KEY?.trim()),
    shinhan: Boolean(process.env.SHINHAN_OPEN_API_KEY?.trim()),
    openBanking: Boolean(process.env.OPEN_BANKING_CLIENT_ID?.trim()),
  };
}
