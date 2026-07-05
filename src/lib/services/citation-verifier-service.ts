/**
 * 서면 인용 자동 검증 — AI가 작성한 초안에서 법조문·판례번호 인용을 파싱하고,
 * 판례 DB / 하드코드된 주요 법령 조문표에 대해 존재 확인 + 폐지 여부 표기.
 *
 * 하드코드 법령은 최소 서브셋 — 관리자의 실무 카테고리와 겹치는 조문 위주.
 */

import { listPrecedents } from "@/lib/services/precedent-database-service";

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

function verifyLaw(lawName: string, articleNo: string): { status: CitationHit["status"]; note?: string } {
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
