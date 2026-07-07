/**
 * AI 응답 fact-check 게이트 — 서면/메시지 발송 전 사실 주장 검증.
 *
 * 1. Claude Sonnet(smart-ai) 으로 verifiable claims 추출
 * 2. 판례 DB / 하드코드 법령표 / 옵션 clientData 로 대조
 * 3. contradicted 이 있으면 게이트 실패
 *
 * 저장:
 *   - 정책: SiteSetting `fact_check.gate.policy`
 *   - 최근 결과 로그: SiteSetting `fact_check.recent` (최대 50건)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { listPrecedents } from "@/lib/services/precedent-database-service";
import { verifyLaw, CITATION_LAW_REGEX, CITATION_PRECEDENT_REGEX } from "@/lib/services/citation-verifier-service";
import { SONNET } from "@/lib/services/model-router-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";

const POLICY_KEY = "fact_check.gate.policy";
const RECENT_KEY = "fact_check.recent";
const MAX_RECENT = 50;

export type FactCheckPolicy = {
  blockOnContradicted: boolean;
  blockOnUnverifiable: boolean;
  maxClaims: number;
};

const DEFAULT_POLICY: FactCheckPolicy = {
  blockOnContradicted: true,
  blockOnUnverifiable: false,
  maxClaims: 8,
};

export type ClaimKind = "law_article" | "precedent" | "client_data" | "date" | "generic";

export type VerifiableClaim = {
  text: string;
  kind: ClaimKind;
  reference?: string;
};

export type ClaimVerdict = {
  claim: VerifiableClaim;
  status: "verified" | "contradicted" | "unverifiable";
  evidence?: string;
};

export type FactCheckResult = {
  passed: boolean;
  policy: FactCheckPolicy;
  verifiable_claims: VerifiableClaim[];
  verified: ClaimVerdict[];
  contradicted: ClaimVerdict[];
  unverifiable: ClaimVerdict[];
  model: string;
  checkedAt: string;
};

export type ClientDataRecord = Record<string, string | number | boolean | null | undefined>;

export async function getFactCheckPolicy(): Promise<FactCheckPolicy> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: POLICY_KEY } });
    if (!row?.value) return DEFAULT_POLICY;
    const parsed = JSON.parse(row.value) as Partial<FactCheckPolicy>;
    return { ...DEFAULT_POLICY, ...parsed };
  } catch (err) {
    logger.warn("[fact-check] policy 읽기 실패", err);
    return DEFAULT_POLICY;
  }
}

export async function setFactCheckPolicy(patch: Partial<FactCheckPolicy>): Promise<FactCheckPolicy> {
  const next = { ...(await getFactCheckPolicy()), ...patch };
  await prisma.siteSetting.upsert({
    where: { key: POLICY_KEY },
    create: { key: POLICY_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

async function extractClaims(text: string, maxClaims: number): Promise<{ claims: VerifiableClaim[]; model: string }> {
  const system =
    "당신은 한국 행정법 서면 검토자입니다. 주어진 초안에서 사실적으로 확인 가능한 주장(claim)만 추출합니다. " +
    "각 claim은 kind ∈ { law_article, precedent, client_data, date, generic } 로 분류하세요. " +
    "출력은 반드시 JSON: {\"claims\":[{\"text\":\"...\",\"kind\":\"...\",\"reference\":\"...\"}]} 형식만 반환합니다.";
  const prompt = `초안:\n"""\n${text}\n"""\n\n최대 ${maxClaims}건까지, 검증 가능한 사실 주장만 반환.`;
  try {
    const res = await smartInvoke("extract", prompt, {
      system,
      maxTokens: 1200,
      forceLevel: "balanced",
      keywords: ["fact-check"],
    });
    const raw = res.text.trim();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) return { claims: [], model: res.model };
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as { claims?: VerifiableClaim[] };
    const claims = (parsed.claims ?? []).slice(0, maxClaims).filter((c) => c && typeof c.text === "string");
    return { claims, model: res.model };
  } catch (err) {
    logger.warn("[fact-check] claim 추출 실패, heuristic fallback 사용", err);
    return { claims: heuristicExtractClaims(text, maxClaims), model: SONNET };
  }
}

function heuristicExtractClaims(text: string, maxClaims: number): VerifiableClaim[] {
  const out: VerifiableClaim[] = [];
  for (const m of text.matchAll(CITATION_LAW_REGEX)) {
    out.push({ text: m[0], kind: "law_article", reference: `${m[1]} 제${m[2]}조` });
    if (out.length >= maxClaims) return out;
  }
  for (const m of text.matchAll(CITATION_PRECEDENT_REGEX)) {
    out.push({ text: m[0], kind: "precedent", reference: m[0].replace(/\s+/g, "") });
    if (out.length >= maxClaims) return out;
  }
  return out;
}

async function verifyClaim(
  claim: VerifiableClaim,
  ctx: { precedentSet: Set<string>; clientData?: ClientDataRecord }
): Promise<ClaimVerdict> {
  if (claim.kind === "law_article") {
    const lawMatch = (claim.reference ?? claim.text).match(/([가-힣A-Za-z]{2,10}법)\s*제?\s*(\d+)\s*조/);
    if (!lawMatch) {
      return { claim, status: "unverifiable", evidence: "법령/조문 파싱 실패" };
    }
    const v = verifyLaw(lawMatch[1], lawMatch[2]);
    if (v.status === "verified") return { claim, status: "verified", evidence: v.note };
    if (v.status === "deprecated")
      return { claim, status: "contradicted", evidence: `폐지·삭제 조문 (${v.note ?? ""})` };
    return { claim, status: "unverifiable", evidence: v.note };
  }
  if (claim.kind === "precedent") {
    const normalized = (claim.reference ?? claim.text).replace(/\s+/g, "");
    const inDb = ctx.precedentSet.has(normalized) ||
      Array.from(ctx.precedentSet).some((p) => p.endsWith(normalized) || normalized.endsWith(p));
    if (inDb) return { claim, status: "verified", evidence: "판례 DB 확인" };
    return { claim, status: "unverifiable", evidence: "판례 DB 미등록" };
  }
  if (claim.kind === "client_data") {
    if (!ctx.clientData) return { claim, status: "unverifiable", evidence: "client 데이터 미제공" };
    const ref = (claim.reference ?? "").trim();
    if (ref && ref in ctx.clientData) {
      const val = String(ctx.clientData[ref] ?? "");
      if (val && claim.text.includes(val)) return { claim, status: "verified", evidence: `${ref}=${val}` };
      return { claim, status: "contradicted", evidence: `${ref}=${val} vs claim="${claim.text}"` };
    }
    // 값 자체가 일치하는 필드 하나라도 존재하는지 확인
    for (const [k, v] of Object.entries(ctx.clientData)) {
      if (v == null) continue;
      const sv = String(v);
      if (sv && claim.text.includes(sv)) return { claim, status: "verified", evidence: `match ${k}=${sv}` };
    }
    return { claim, status: "unverifiable", evidence: "일치 필드 없음" };
  }
  return { claim, status: "unverifiable", evidence: "검증 규칙 없음" };
}

export async function runFactCheckGate(
  text: string,
  options?: { clientData?: ClientDataRecord; policy?: Partial<FactCheckPolicy> }
): Promise<FactCheckResult> {
  const policy: FactCheckPolicy = { ...(await getFactCheckPolicy()), ...(options?.policy ?? {}) };
  const { claims, model } = await extractClaims(text, policy.maxClaims);
  const precedents = await listPrecedents();
  const precedentSet = new Set<string>(precedents.map((p) => p.caseNo.replace(/\s+/g, "")));
  const verdicts: ClaimVerdict[] = [];
  for (const c of claims) {
    const v = await verifyClaim(c, { precedentSet, clientData: options?.clientData });
    verdicts.push(v);
  }
  const verified = verdicts.filter((v) => v.status === "verified");
  const contradicted = verdicts.filter((v) => v.status === "contradicted");
  const unverifiable = verdicts.filter((v) => v.status === "unverifiable");
  const passed =
    !(policy.blockOnContradicted && contradicted.length > 0) &&
    !(policy.blockOnUnverifiable && unverifiable.length > 0);
  const result: FactCheckResult = {
    passed,
    policy,
    verifiable_claims: claims,
    verified,
    contradicted,
    unverifiable,
    model,
    checkedAt: new Date().toISOString(),
  };
  await appendRecent(result, text);
  return result;
}

async function appendRecent(result: FactCheckResult, text: string): Promise<void> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: RECENT_KEY } });
    const list: Array<{
      at: string;
      passed: boolean;
      excerpt: string;
      counts: { total: number; verified: number; contradicted: number; unverifiable: number };
      model: string;
    }> = row?.value ? JSON.parse(row.value) : [];
    list.unshift({
      at: result.checkedAt,
      passed: result.passed,
      excerpt: text.slice(0, 140),
      counts: {
        total: result.verifiable_claims.length,
        verified: result.verified.length,
        contradicted: result.contradicted.length,
        unverifiable: result.unverifiable.length,
      },
      model: result.model,
    });
    const trimmed = list.slice(0, MAX_RECENT);
    await prisma.siteSetting.upsert({
      where: { key: RECENT_KEY },
      create: { key: RECENT_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    });
  } catch (err) {
    logger.warn("[fact-check] recent 기록 실패", err);
  }
}

export async function getRecentFactChecks(): Promise<Array<{
  at: string;
  passed: boolean;
  excerpt: string;
  counts: { total: number; verified: number; contradicted: number; unverifiable: number };
  model: string;
}>> {
  const row = await prisma.siteSetting.findUnique({ where: { key: RECENT_KEY } });
  if (!row?.value) return [];
  try {
    return JSON.parse(row.value);
  } catch {
    return [];
  }
}
