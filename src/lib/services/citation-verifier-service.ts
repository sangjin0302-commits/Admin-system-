/**
 * 서면 인용 자동 검증 — AI가 작성한 초안에서 법조문·판례번호 인용을 파싱하고,
 * 판례 DB / 하드코드된 주요 법령 조문표에 대해 존재 확인 + 폐지 여부 표기.
 *
 * 하드코드 법령은 최소 서브셋 — 관리자의 실무 카테고리와 겹치는 조문 위주.
 */

import { prisma } from "@/lib/prisma/client";
import { listPrecedents } from "@/lib/services/precedent-database-service";
import { logger } from "@/lib/utils/logger";

export type CitationKind = "law" | "precedent";

export type CitationHit = {
  kind: CitationKind;
  raw: string;
  normalized: string;
  offset: number;
  status: "verified" | "unknown" | "deprecated";
  note?: string;
};

export type VerificationResult = {
  citations: CitationHit[];
  summary: {
    total: number;
    verified: number;
    unknown: number;
    deprecated: number;
  };
  verifiedAt: string;
};

// ─── 하드코드 법령 서브셋 ────────────────────────────────────────────
// { 법명: { 조문번호: { status, note? } } }
type LawArticle = { status: "verified" | "deprecated"; note?: string };
const LAW_ARTICLES: Record<string, Record<string, LawArticle>> = {
  행정소송법: {
    "1": { status: "verified" },
    "2": { status: "verified" },
    "12": { status: "verified", note: "원고적격" },
    "13": { status: "verified" },
    "18": { status: "verified", note: "행정심판 전치주의" },
    "19": { status: "verified" },
    "20": { status: "verified", note: "제소기간" },
    "27": { status: "verified" },
    "28": { status: "verified", note: "사정판결" },
    "30": { status: "verified" },
  },
  행정심판법: {
    "1": { status: "verified" },
    "2": { status: "verified" },
    "3": { status: "verified" },
    "5": { status: "verified", note: "심판대상" },
    "6": { status: "verified" },
    "13": { status: "verified", note: "청구인 적격" },
    "23": { status: "verified" },
    "27": { status: "verified", note: "청구기간" },
    "43": { status: "verified", note: "재결" },
    "44": { status: "verified" },
    "47": { status: "verified" },
  },
  출입국관리법: {
    "7": { status: "verified" },
    "10": { status: "verified" },
    "17": { status: "verified" },
    "20": { status: "verified", note: "체류자격 변경" },
    "24": { status: "verified" },
    "25": { status: "verified" },
    "46": { status: "verified", note: "강제퇴거 대상" },
    "58": { status: "verified" },
    "60": { status: "verified", note: "이의신청" },
    "76": { status: "deprecated", note: "2021 개정 삭제 조문" },
  },
  건축법: {
    "11": { status: "verified", note: "건축허가" },
    "14": { status: "verified" },
    "16": { status: "verified" },
    "22": { status: "verified" },
    "79": { status: "verified", note: "위반건축물 시정명령" },
    "80": { status: "verified", note: "이행강제금" },
  },
  식품위생법: {
    "37": { status: "verified", note: "영업허가" },
    "44": { status: "verified" },
    "75": { status: "verified", note: "행정처분" },
  },
  행정절차법: {
    "21": { status: "verified", note: "처분의 사전통지" },
    "22": { status: "verified", note: "의견제출" },
    "23": { status: "verified" },
    "24": { status: "verified" },
  },
};

// ─── 정규식 파서 ──────────────────────────────────────────────────
// 법조문: "행정소송법 제12조" / "행정심판법 제27조 제1항" 등
const LAW_REGEX = /([가-힣A-Za-z]{2,10}법)\s*제\s*(\d+)\s*조(?:\s*제\s*\d+\s*항)?/g;
// 판례번호: "대법원 2018두12345" / "2020구합1234" / "2019나56789"
const PRECEDENT_REGEX = /((?:대법원\s*|서울고등법원\s*|헌법재판소\s*)?\d{4}\s*(?:두|다|가합|가단|구합|구단|나|고합|고단|허)\d{2,6})/g;

// 테스트용 export — 순수 파서/검증기 재사용
export const CITATION_LAW_REGEX = LAW_REGEX;
export const CITATION_PRECEDENT_REGEX = PRECEDENT_REGEX;

export function verifyLaw(lawName: string, articleNo: string): { status: CitationHit["status"]; note?: string } {
  const table = LAW_ARTICLES[lawName];
  if (!table) return { status: "unknown", note: "하드코드 조문표에 없음 (외부 검증 필요)" };
  const art = table[articleNo];
  if (!art) return { status: "unknown", note: `${lawName}에서 제${articleNo}조 미확인` };
  return { status: art.status === "deprecated" ? "deprecated" : "verified", note: art.note };
}

export async function verifyCitations(text: string): Promise<VerificationResult> {
  const src = text ?? "";
  const hits: CitationHit[] = [];

  // Precedents from DB
  const precedents = await listPrecedents();
  const precSet = new Set<string>();
  for (const p of precedents) {
    precSet.add(p.caseNo.replace(/\s+/g, ""));
  }

  const seenAt = new Set<number>();

  for (const m of src.matchAll(LAW_REGEX)) {
    const raw = m[0];
    const lawName = m[1];
    const articleNo = m[2];
    const offset = m.index ?? 0;
    if (seenAt.has(offset)) continue;
    seenAt.add(offset);
    const v = verifyLaw(lawName, articleNo);
    hits.push({
      kind: "law",
      raw,
      normalized: `${lawName} 제${articleNo}조`,
      offset,
      status: v.status,
      note: v.note,
    });
  }

  for (const m of src.matchAll(PRECEDENT_REGEX)) {
    const raw = m[0];
    const normalized = raw.replace(/\s+/g, "");
    const offset = m.index ?? 0;
    if (seenAt.has(offset)) continue;
    seenAt.add(offset);
    const inDb = precSet.has(normalized) || Array.from(precSet).some((p) => p.endsWith(normalized) || normalized.endsWith(p));
    hits.push({
      kind: "precedent",
      raw,
      normalized,
      offset,
      status: inDb ? "verified" : "unknown",
      note: inDb ? "판례 DB 확인됨" : "판례 DB 미등록 (원문 확인 필요)",
    });
  }

  hits.sort((a, b) => a.offset - b.offset);

  const summary = {
    total: hits.length,
    verified: hits.filter((h) => h.status === "verified").length,
    unknown: hits.filter((h) => h.status === "unknown").length,
    deprecated: hits.filter((h) => h.status === "deprecated").length,
  };

  return {
    citations: hits,
    summary,
    verifiedAt: new Date().toISOString(),
  };
}

// ─── 발송 전 게이트 (블로커/경고 판정) ───────────────────────────────
const GATE_POLICY_KEY = "citation.gate.policy";

export type CitationGatePolicy = {
  blockOnDeprecated: boolean;
  blockOnUnknownLaw: boolean;
  blockOnUnknownPrecedent: boolean;
  minCitations: number;
};

const DEFAULT_GATE_POLICY: CitationGatePolicy = {
  blockOnDeprecated: true,
  blockOnUnknownLaw: false,
  blockOnUnknownPrecedent: false,
  minCitations: 0,
};

export async function getCitationGatePolicy(): Promise<CitationGatePolicy> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: GATE_POLICY_KEY } });
    if (!row?.value) return DEFAULT_GATE_POLICY;
    const parsed = JSON.parse(row.value) as Partial<CitationGatePolicy>;
    return { ...DEFAULT_GATE_POLICY, ...parsed };
  } catch (err) {
    logger.warn("[citation-gate] 정책 읽기 실패", err);
    return DEFAULT_GATE_POLICY;
  }
}

export async function setCitationGatePolicy(patch: Partial<CitationGatePolicy>): Promise<CitationGatePolicy> {
  const current = await getCitationGatePolicy();
  const next: CitationGatePolicy = { ...current, ...patch };
  await prisma.siteSetting.upsert({
    where: { key: GATE_POLICY_KEY },
    create: { key: GATE_POLICY_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

export type CitationGateIssue = {
  code:
    | "deprecated_law"
    | "unknown_law"
    | "unknown_precedent"
    | "no_citations"
    | "too_few_citations";
  citation?: CitationHit;
  message: string;
};

export type CitationGateResult = {
  passed: boolean;
  blockers: CitationGateIssue[];
  warnings: CitationGateIssue[];
  verification: VerificationResult;
  policy: CitationGatePolicy;
};

export async function runVerificationGate(
  text: string,
  options?: { policy?: Partial<CitationGatePolicy> }
): Promise<CitationGateResult> {
  const policyBase = await getCitationGatePolicy();
  const policy: CitationGatePolicy = { ...policyBase, ...(options?.policy ?? {}) };
  const verification = await verifyCitations(text);
  const blockers: CitationGateIssue[] = [];
  const warnings: CitationGateIssue[] = [];

  for (const c of verification.citations) {
    if (c.status === "deprecated") {
      const issue: CitationGateIssue = {
        code: "deprecated_law",
        citation: c,
        message: `폐지·삭제 조문 인용: ${c.normalized}${c.note ? ` (${c.note})` : ""}`,
      };
      if (policy.blockOnDeprecated) blockers.push(issue);
      else warnings.push(issue);
    } else if (c.status === "unknown") {
      const isLaw = c.kind === "law";
      const issue: CitationGateIssue = {
        code: isLaw ? "unknown_law" : "unknown_precedent",
        citation: c,
        message: `${isLaw ? "미확인 법조문" : "미확인 판례"}: ${c.normalized}${c.note ? ` (${c.note})` : ""}`,
      };
      const block = isLaw ? policy.blockOnUnknownLaw : policy.blockOnUnknownPrecedent;
      if (block) blockers.push(issue);
      else warnings.push(issue);
    }
  }

  if (policy.minCitations > 0 && verification.summary.total < policy.minCitations) {
    blockers.push({
      code: verification.summary.total === 0 ? "no_citations" : "too_few_citations",
      message: `인용 최소 ${policy.minCitations}건 필요 (현재 ${verification.summary.total}건)`,
    });
  }

  return {
    passed: blockers.length === 0,
    blockers,
    warnings,
    verification,
    policy,
  };
}
