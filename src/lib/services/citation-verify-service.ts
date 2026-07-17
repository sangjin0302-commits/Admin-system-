/**
 * 법령 인용 검증 — AI가 지어낸 조문 인용을 잡는다.
 *
 * case-research의 AI 요약은 조문 번호를 지어내거나, 실존하는 조문에
 * 엉뚱한 제목을 붙일 수 있다. 행정사 서면에 잘못된 조문이 들어가면 사고이므로
 * 요약 생성 후 반드시 이 검증을 거친다.
 *
 * 2단 매칭 (korean-law-mcp의 접근을 참고해 재구현 — 해당 패키지는
 * law.go.kr을 직접 호출해 Vercel IP 화이트리스트에 막히고, hwp/pdf 파서까지
 * 딸려와 번들이 커진다. 우리는 Lightsail 프록시 경유 부품을 그대로 쓴다):
 *   L1 정규화 후 연속 30자 이상 공통 substring
 *   L2 문자 bigram Jaccard >= 0.25 (한국어 조사/어미 차이에 robust)
 */

import { createHash } from "crypto";

import { withCache } from "@/lib/services/cache-service";
import {
  getLawArticleByJo,
  searchLawExact,
} from "@/lib/services/law-api-service";
import { logger } from "@/lib/utils/logger";

const CACHE_TTL_SEC = 3600; // 1 hour
const EXACT_MIN_LEN = 30;
const JACCARD_MIN = 0.25;
const LCS_MAX_INPUT = 2000;
const CONCURRENCY = 5;

// ---------- 정규화 ----------

/** 원문자 ①②③ → (1)(2)(3), 괄호/중점/공백/제로폭 정리 */
export function normalizeLegalText(s: string): string {
  if (!s) return "";
  let out = s;
  // 원문자 ①(U+2460)~⑳(U+2473) → (1)~(20)
  out = out.replace(/[①-⑳]/g, (ch) => `(${ch.charCodeAt(0) - 0x2460 + 1})`);
  // 제로폭 제거
  out = out.replace(/[​‌‍﻿]/g, "");
  // NBSP → space
  out = out.replace(/ /g, " ");
  // 「」『』 제거
  out = out.replace(/[「」『』]/g, "");
  // 중점 → space
  out = out.replace(/[·•]/g, " ");
  // 공백 정리
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

// ---------- 매칭 ----------

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  const t = s.replace(/\s+/g, "");
  if (t.length === 1) {
    out.add(t);
    return out;
  }
  for (let i = 0; i + 1 < t.length; i++) out.add(t.slice(i, i + 2));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** rolling 2-row DP. 입력은 LCS_MAX_INPUT 자로 잘라 상한을 둔다. */
function longestCommonSubstringLen(a: string, b: string): number {
  const x = a.slice(0, LCS_MAX_INPUT);
  const y = b.slice(0, LCS_MAX_INPUT);
  if (!x || !y) return 0;
  let prev = new Uint32Array(y.length + 1);
  let curr = new Uint32Array(y.length + 1);
  let best = 0;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      if (x[i - 1] === y[j - 1]) {
        curr[j] = prev[j - 1] + 1;
        if (curr[j] > best) best = curr[j];
      } else {
        curr[j] = 0;
      }
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
    curr.fill(0);
  }
  return best;
}

export function matchesContent(
  cited: string,
  actual: string
): { match: boolean; layer: "exact" | "jaccard" | "none"; score: number } {
  const c = normalizeLegalText(cited);
  const a = normalizeLegalText(actual);
  if (!c || !a) return { match: false, layer: "none", score: 0 };

  // L1 — 정확(연속 30자 이상 공통 substring). 짧은 조문제목은 완전일치로도 통과시킨다.
  if (c === a) return { match: true, layer: "exact", score: 1 };
  const lcs = longestCommonSubstringLen(c, a);
  if (lcs >= EXACT_MIN_LEN) {
    return { match: true, layer: "exact", score: 1 };
  }

  // L2 — bigram Jaccard
  const score = jaccard(bigrams(c), bigrams(a));
  if (score >= JACCARD_MIN) return { match: true, layer: "jaccard", score };
  return { match: false, layer: "none", score };
}

// ---------- 인용 추출 ----------

export type ParsedCitation = {
  raw: string; // 원문 그대로
  lawName: string; // 「」 안 또는 앞 토큰
  article: string; // "제24조", "제99조의2"
  citedTitle: string; // 괄호 안 제목, 없으면 ""
};

/**
 * 3가지 형태를 잡는다:
 *   「법령명」 제N조(제목) / 법령명 제N조(제목) / 법령명 제N조의M
 *   같은 법·동법 제N조 → 직전 lawName 상속
 * 애매하면 버린다(false positive보다 miss가 낫다).
 */
const CITATION_RE =
  /(?:「([^」\n]{2,40})」|(같은\s*법|동\s*법)|([가-힣][가-힣0-9]{0,30}?(?:시행규칙|시행령|법률|조례|규정|규칙|법|령)))\s*(제\d+조(?:의\d+)?)(?:\s*\(([^()\n]{1,60})\))?/g;

/** 지시대명사 등 법령명으로 볼 수 없는 토큰 */
const BAD_LAW_NAME = /^(같은법|동법|이법|그법|해당법|본법|위법)$/;

export function extractCitations(text: string, max = 15): ParsedCitation[] {
  if (!text) return [];
  const out: ParsedCitation[] = [];
  const seen = new Set<string>();
  let lastLawName = "";

  CITATION_RE.lastIndex = 0;
  for (const m of text.matchAll(CITATION_RE)) {
    const [raw, bracketed, anaphor, bare, article, title] = m;

    let lawName = "";
    if (bracketed) {
      lawName = bracketed.trim();
    } else if (anaphor) {
      if (!lastLawName) continue; // 선행 법령명 없으면 skip
      lawName = lastLawName;
    } else if (bare) {
      lawName = bare.trim();
    }
    if (!lawName) continue;
    if (BAD_LAW_NAME.test(lawName.replace(/\s+/g, ""))) continue;
    if (lawName.length < 2) continue;

    lastLawName = lawName;

    const key = `${lawName}|${article}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      raw: raw.trim(),
      lawName,
      article,
      citedTitle: (title ?? "").trim(),
    });
    if (out.length >= max) break;
  }
  return out;
}

// ---------- 검증 ----------

export type CitationVerdict = {
  citation: ParsedCitation;
  status:
    | "verified"
    | "content_mismatch"
    | "article_not_found"
    | "law_not_found"
    | "unchecked";
  actualTitle: string;
  detail: string; // 사람이 읽는 설명
  layer?: "exact" | "jaccard" | "none";
  score?: number;
};

export type CitationVerifyResult = {
  total: number;
  verified: number;
  mismatched: number;
  notFound: number;
  verdicts: CitationVerdict[];
  hallucinationDetected: boolean;
};

async function verifyOne(c: ParsedCitation): Promise<CitationVerdict> {
  try {
    const laws = await searchLawExact(c.lawName, 3);
    if (laws.length === 0) {
      return {
        citation: c,
        status: "law_not_found",
        actualTitle: "",
        detail: `법령 '${c.lawName}'을(를) 국가법령정보센터에서 찾지 못했습니다.`,
      };
    }
    const mst = laws[0].id;
    const art = await getLawArticleByJo(mst, c.article);
    if (!art || !art.content.trim()) {
      return {
        citation: c,
        status: "article_not_found",
        actualTitle: "",
        detail: `'${c.lawName}'에 ${c.article}이(가) 존재하지 않습니다.`,
      };
    }

    const actualTitle = art.title || "";
    if (!c.citedTitle) {
      return {
        citation: c,
        status: "verified",
        actualTitle,
        detail: `${c.lawName} ${c.article} 실존 확인 (제목 미인용이라 실존만 확인).`,
      };
    }
    if (!actualTitle) {
      return {
        citation: c,
        status: "verified",
        actualTitle: "",
        detail: `${c.lawName} ${c.article} 실존 확인 (해당 조문에 조문제목이 없어 제목 대조 생략).`,
      };
    }

    const r = matchesContent(c.citedTitle, actualTitle);
    if (r.match) {
      return {
        citation: c,
        status: "verified",
        actualTitle,
        detail: `${c.lawName} ${c.article}(${actualTitle}) 일치.`,
        layer: r.layer,
        score: r.score,
      };
    }
    return {
      citation: c,
      status: "content_mismatch",
      actualTitle,
      detail: `${c.lawName} ${c.article} — 인용 제목 '${c.citedTitle}' ≠ 실제 조문제목 '${actualTitle}'`,
      layer: r.layer,
      score: r.score,
    };
  } catch (err) {
    logger.warn("citation-verify: single citation check failed", {
      raw: c.raw,
      err: String(err),
    });
    return {
      citation: c,
      status: "unchecked",
      actualTitle: "",
      detail: "조회에 실패하여 검증하지 못했습니다.",
    };
  }
}

function summarize(verdicts: CitationVerdict[]): CitationVerifyResult {
  const verified = verdicts.filter((v) => v.status === "verified").length;
  const mismatched = verdicts.filter((v) => v.status === "content_mismatch").length;
  const notFound = verdicts.filter(
    (v) => v.status === "article_not_found" || v.status === "law_not_found"
  ).length;
  return {
    total: verdicts.length,
    verified,
    mismatched,
    notFound,
    verdicts,
    hallucinationDetected: mismatched + notFound > 0,
  };
}

export async function verifyCitations(
  text: string,
  max = 15
): Promise<CitationVerifyResult> {
  const citations = extractCitations(text, max);
  if (citations.length === 0) {
    return {
      total: 0,
      verified: 0,
      mismatched: 0,
      notFound: 0,
      verdicts: [],
      hallucinationDetected: false,
    };
  }

  const hash = createHash("md5").update(text).digest("hex").slice(0, 16);
  const key = `citation-verify:${hash}:${max}`;

  try {
    return await withCache<CitationVerifyResult>(key, CACHE_TTL_SEC, async () => {
      const verdicts: CitationVerdict[] = [];
      for (let i = 0; i < citations.length; i += CONCURRENCY) {
        const chunk = citations.slice(i, i + CONCURRENCY);
        verdicts.push(...(await Promise.all(chunk.map(verifyOne))));
      }
      return summarize(verdicts);
    });
  } catch (err) {
    logger.warn("citation-verify: verification failed", { err: String(err) });
    return summarize(
      citations.map((c) => ({
        citation: c,
        status: "unchecked" as const,
        actualTitle: "",
        detail: "검증 중 오류가 발생하여 확인하지 못했습니다.",
      }))
    );
  }
}
