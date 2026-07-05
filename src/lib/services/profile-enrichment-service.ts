/**
 * 고객 프로필 자동 강화.
 * 이메일 도메인 → 회사/산업/신뢰도 추정. 옵션으로 Claude Haiku 웹 검색 힌트.
 * Storage: SiteSetting key = "client.enrichment.<clientId>" (JSON)
 */
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export interface EnrichedProfile {
  company?: string;
  industry?: string;
  seniority?: string;
  socialLinks?: { linkedin?: string; hint?: string };
  confidence: number; // 0..1
  source: "domain" | "manual" | "ai" | "mixed";
  updatedAt: string;
  notes?: string;
}

const KEY_PREFIX = "client.enrichment.";

// 한국 대기업/공공/일반 도메인 매핑 (확장 가능)
const DOMAIN_MAP: Record<string, { company: string; industry: string }> = {
  "samsung.com": { company: "삼성", industry: "전자·제조" },
  "samsungelectronics.com": { company: "삼성전자", industry: "전자·제조" },
  "kakao.com": { company: "카카오", industry: "인터넷·플랫폼" },
  "kakaocorp.com": { company: "카카오", industry: "인터넷·플랫폼" },
  "naver.com": { company: "네이버", industry: "인터넷·플랫폼" },
  "navercorp.com": { company: "네이버", industry: "인터넷·플랫폼" },
  "lg.com": { company: "LG", industry: "전자·제조" },
  "lgcns.com": { company: "LG CNS", industry: "IT 서비스" },
  "hyundai.com": { company: "현대", industry: "자동차·제조" },
  "sk.com": { company: "SK", industry: "그룹·에너지" },
  "skhynix.com": { company: "SK하이닉스", industry: "반도체" },
  "coupang.com": { company: "쿠팡", industry: "이커머스" },
  "toss.im": { company: "토스", industry: "핀테크" },
  "kbfg.com": { company: "KB금융", industry: "금융" },
  "shinhan.com": { company: "신한금융", industry: "금융" },
  "posco.com": { company: "포스코", industry: "철강·소재" },
};

// 일반 개인/공공 도메인 힌트
const CONSUMER_DOMAINS = new Set([
  "gmail.com", "naver.com", "daum.net", "hanmail.net", "kakao.com", "yahoo.com",
  "hotmail.com", "outlook.com", "nate.com", "icloud.com",
]);

function domainOf(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

function enrichmentKey(clientId: string): string {
  return `${KEY_PREFIX}${clientId}`;
}

function domainHeuristic(email: string | null | undefined): EnrichedProfile | null {
  const domain = domainOf(email);
  if (!domain) return null;
  const hit = DOMAIN_MAP[domain];
  if (hit) {
    return {
      company: hit.company,
      industry: hit.industry,
      confidence: 0.85,
      source: "domain",
      updatedAt: new Date().toISOString(),
      notes: `도메인 ${domain} 매칭`,
    };
  }
  if (CONSUMER_DOMAINS.has(domain)) {
    return {
      confidence: 0.4,
      source: "domain",
      updatedAt: new Date().toISOString(),
      notes: `개인 이메일 도메인 (${domain}) — 회사 정보 없음`,
    };
  }
  // 사용자 정의 도메인 → 회사일 가능성
  const guessedCompany = domain.split(".")[0];
  return {
    company: guessedCompany ? guessedCompany.charAt(0).toUpperCase() + guessedCompany.slice(1) : undefined,
    industry: undefined,
    confidence: 0.35,
    source: "domain",
    updatedAt: new Date().toISOString(),
    notes: `사용자 도메인 (${domain}) — 회사명 추정`,
  };
}

async function aiWebHint(email: string, phone: string | null | undefined): Promise<Partial<EnrichedProfile> | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  const domain = domainOf(email);
  if (!domain || CONSUMER_DOMAINS.has(domain)) return null;
  // Best-effort stub — 실제 웹 검색 없이 Claude에게 도메인 기반 산업/시니어리티 추정만 요청
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: "Given a Korean business email domain, guess the company name (Korean), industry (Korean), and typical seniority hint. Output ONLY JSON: {\"company\":\"...\",\"industry\":\"...\",\"seniority\":\"...\"}. Use null for unknown.",
        messages: [{ role: "user", content: `Email: ${email}\nDomain: ${domain}\nPhone: ${phone ?? "unknown"}` }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim();
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { company?: string | null; industry?: string | null; seniority?: string | null };
    return {
      company: parsed.company ?? undefined,
      industry: parsed.industry ?? undefined,
      seniority: parsed.seniority ?? undefined,
      source: "ai",
      confidence: 0.5,
    };
  } catch (err) {
    logger.warn("[profile-enrichment] ai hint failed", err);
    return null;
  }
}

export async function enrichClientProfile(
  email: string,
  phone?: string | null
): Promise<EnrichedProfile> {
  const domainResult = domainHeuristic(email);
  const aiResult = await aiWebHint(email, phone).catch(() => null);
  if (domainResult && aiResult) {
    return {
      company: aiResult.company ?? domainResult.company,
      industry: aiResult.industry ?? domainResult.industry,
      seniority: aiResult.seniority ?? domainResult.seniority,
      socialLinks: domainResult.socialLinks,
      confidence: Math.max(domainResult.confidence, aiResult.confidence ?? 0),
      source: "mixed",
      updatedAt: new Date().toISOString(),
      notes: domainResult.notes,
    };
  }
  if (domainResult) return domainResult;
  return {
    confidence: 0,
    source: "domain",
    updatedAt: new Date().toISOString(),
    notes: "이메일 도메인 추출 실패",
  };
}

export async function getStoredEnrichment(clientId: string): Promise<EnrichedProfile | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: enrichmentKey(clientId) } }).catch(() => null);
  if (!row?.value) return null;
  try { return JSON.parse(row.value) as EnrichedProfile; } catch { return null; }
}

export async function saveEnrichment(clientId: string, profile: EnrichedProfile): Promise<void> {
  const value = JSON.stringify(profile);
  await prisma.siteSetting.upsert({
    where: { key: enrichmentKey(clientId) },
    create: { key: enrichmentKey(clientId), value },
    update: { value },
  });
}

/** 재조회: 도메인 + AI 힌트를 다시 계산해 저장. */
export async function refreshEnrichment(clientId: string, email: string, phone?: string | null): Promise<EnrichedProfile> {
  const fresh = await enrichClientProfile(email, phone);
  await saveEnrichment(clientId, fresh);
  return fresh;
}

/** 수동 편집: 관리자가 입력한 필드로 덮어씀. */
export async function overrideEnrichment(
  clientId: string,
  patch: Partial<Omit<EnrichedProfile, "updatedAt" | "source">>
): Promise<EnrichedProfile> {
  const existing = (await getStoredEnrichment(clientId)) ?? {
    confidence: 0.7,
    source: "manual",
    updatedAt: new Date().toISOString(),
  };
  const next: EnrichedProfile = {
    ...existing,
    ...patch,
    source: "manual",
    confidence: patch.confidence ?? Math.max(existing.confidence, 0.9),
    updatedAt: new Date().toISOString(),
  };
  await saveEnrichment(clientId, next);
  return next;
}
