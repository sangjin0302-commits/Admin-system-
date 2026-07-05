/**
 * 의뢰인 페르소나 자동 분석.
 *
 * Closed CaseMatter 최근 500건에서 Inquiry 특성을 뽑아 5개 페르소나로 클러스터링.
 * Claude Haiku(있으면) 로 aggregate 요약 → 5 persona. 실패 시 결정론적 fallback.
 *
 * 결과는 SiteSetting `persona.clusters` 에 TTL 30일 캐시.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const KEY = "persona.clusters";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const SAMPLE_SIZE = 500;

export type Persona = {
  id: string;
  name: string;
  size: number;
  traits: string[];
  avgFee: number;
  topCategories: string[];
  recommendedCta: string;
};

type CacheEnvelope = {
  updatedAt: string;
  personas: Persona[];
  totalSamples: number;
};

/**
 * 저장된 클러스터 조회. 만료됐거나 없으면 null.
 */
export async function getCachedPersonas(): Promise<CacheEnvelope | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value) as CacheEnvelope;
    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (age > TTL_MS) return null;
    return parsed;
  } catch (err) {
    logger.warn("[persona-analysis] read failed", err);
    return null;
  }
}

function extractFeatures(desc: string): { budget: number | null; urgencyHint: string | null; hasCorp: boolean } {
  const budgetMatch = desc.match(/(\d[\d,]*)\s*만/);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) * 10000 : null;
  const urgencyHint =
    /긴급|급함|빨리|당장|즉시/.test(desc) ? "긴급" : /여유|천천히/.test(desc) ? "여유" : null;
  const hasCorp = /법인|회사|기업|사업자/.test(desc);
  return { budget, urgencyHint, hasCorp };
}

type Sample = {
  category: string;
  matterType: string;
  urgency: string;
  clientType: string;
  intakeSource: string;
  intakeCategory: string | null;
  budget: number | null;
  urgencyHint: string | null;
  hasCorp: boolean;
  feeAmount: number | null;
};

async function loadSamples(): Promise<Sample[]> {
  const closed = await prisma.caseMatter.findMany({
    where: { status: "CLOSED" },
    orderBy: { closedAt: "desc" },
    take: SAMPLE_SIZE,
    include: {
      inquiry: {
        select: {
          description: true,
          urgencyLevel: true,
          clientType: true,
          intakeSource: true,
          intakeCategory: true,
        },
      },
      accountingMemo: { select: { feeAmount: true } },
    },
  });

  return closed
    .filter((c) => c.inquiry)
    .map((c) => {
      const inq = c.inquiry!;
      const feats = extractFeatures(inq.description ?? "");
      return {
        category: c.category,
        matterType: c.matterType ?? "OTHER",
        urgency: inq.urgencyLevel,
        clientType: inq.clientType,
        intakeSource: inq.intakeSource,
        intakeCategory: inq.intakeCategory,
        budget: feats.budget,
        urgencyHint: feats.urgencyHint,
        hasCorp: feats.hasCorp,
        feeAmount: c.accountingMemo?.feeAmount ?? null,
      };
    });
}

/**
 * 결정론적 클러스터링 fallback — clientType × urgency 조합 기준.
 */
function deterministicCluster(samples: Sample[]): Persona[] {
  if (samples.length === 0) return [];

  // 5개 pre-defined seed bucket
  const buckets: { key: string; name: string; match: (s: Sample) => boolean }[] = [
    {
      key: "urgent-individual",
      name: "긴급 개인 의뢰인",
      match: (s) => s.clientType === "INDIVIDUAL" && (s.urgency === "HIGH" || s.urgency === "CRITICAL"),
    },
    {
      key: "corporate",
      name: "법인/사업자 의뢰인",
      match: (s) => s.clientType === "CORPORATE" || s.hasCorp,
    },
    {
      key: "immigration",
      name: "체류/이민 실무 고객",
      match: (s) => s.category === "VISA_STAY",
    },
    {
      key: "admin-appeal",
      name: "행정심판 재도전 고객",
      match: (s) => s.category === "ADMIN_APPEAL",
    },
    {
      key: "budget-sensitive",
      name: "예산 민감 신중형",
      match: (s) => (s.budget != null && s.budget < 500000) || s.urgency === "LOW",
    },
  ];

  const assigned = new Set<Sample>();
  const personas: Persona[] = [];

  for (const b of buckets) {
    const group = samples.filter((s) => !assigned.has(s) && b.match(s));
    group.forEach((g) => assigned.add(g));

    const fees = group.map((g) => g.feeAmount).filter((f): f is number => f != null);
    const avgFee = fees.length ? Math.round(fees.reduce((a, c) => a + c, 0) / fees.length) : 0;

    const catCount = new Map<string, number>();
    for (const g of group) catCount.set(g.category, (catCount.get(g.category) ?? 0) + 1);
    const topCategories = [...catCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c);

    const traits: string[] = [];
    if (b.key === "urgent-individual") traits.push("응답 속도 최우선", "간단명료 안내 선호");
    if (b.key === "corporate") traits.push("세금계산서 필수", "결정권자 다층 컨택");
    if (b.key === "immigration") traits.push("체류자격 만료일 민감", "다국어 자료 필요");
    if (b.key === "admin-appeal") traits.push("이전 결과 불만", "증거 정리 요구 강함");
    if (b.key === "budget-sensitive") traits.push("견적 여러 곳 비교", "분납 요청 확률 높음");

    const recommendedCta =
      b.key === "urgent-individual"
        ? "24시간 콜백 예약"
        : b.key === "corporate"
        ? "법인 컨설팅 미팅 제안"
        : b.key === "immigration"
        ? "체류기간 D-30 리마인더 등록"
        : b.key === "admin-appeal"
        ? "이전 처분서 무료 리뷰 제안"
        : "분납 옵션 명시된 견적서 발송";

    personas.push({
      id: b.key,
      name: b.name,
      size: group.length,
      traits,
      avgFee,
      topCategories,
      recommendedCta,
    });
  }

  return personas;
}

/**
 * Claude Haiku 로 페르소나 정제. 실패/키 없음이면 null 반환.
 */
async function refineWithHaiku(samples: Sample[], base: Persona[]): Promise<Persona[] | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const aggregate = base.map((p) => ({
    id: p.id,
    name: p.name,
    size: p.size,
    avgFee: p.avgFee,
    topCategories: p.topCategories,
    baseTraits: p.traits,
  }));

  const userMsg = `당신은 한국 행정법·이민법 전문 로펌 CRM 분석가입니다. 아래는 지난 최대 ${samples.length}건 종결 사건에서 도출된 5개 임시 페르소나 통계입니다.

${JSON.stringify(aggregate, null, 2)}

각 페르소나에 대해 (1) 더 자연스러운 한국어 이름 (2) 실무 특성 3-4개 (3) 추천 CTA 1개 를 JSON 배열로만 출력하세요. 각 원소는 {"id","name","traits":[..],"recommendedCta"} 형태여야 합니다. 통계 수치(size,avgFee,topCategories)는 그대로 두세요. 설명 문장 없이 JSON 만 출력.`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) {
      logger.warn("[persona-analysis] anthropic error", res.status);
      return null;
    }
    const data = await res.json();
    const text: string | undefined = data?.content?.[0]?.text;
    if (!text) return null;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const arr = JSON.parse(jsonMatch[0]) as Array<{ id: string; name?: string; traits?: string[]; recommendedCta?: string }>;
    if (!Array.isArray(arr)) return null;

    return base.map((p) => {
      const refined = arr.find((r) => r.id === p.id);
      if (!refined) return p;
      return {
        ...p,
        name: typeof refined.name === "string" && refined.name.trim() ? refined.name.trim() : p.name,
        traits: Array.isArray(refined.traits) && refined.traits.length ? refined.traits.slice(0, 5).map(String) : p.traits,
        recommendedCta:
          typeof refined.recommendedCta === "string" && refined.recommendedCta.trim()
            ? refined.recommendedCta.trim()
            : p.recommendedCta,
      };
    });
  } catch (err) {
    logger.warn("[persona-analysis] refine exception", err);
    return null;
  }
}

/**
 * 클러스터 재계산 및 저장. 명시적 관리자 액션에서만 호출.
 */
export async function regeneratePersonas(): Promise<CacheEnvelope> {
  const samples = await loadSamples();
  const base = deterministicCluster(samples);
  const refined = (await refineWithHaiku(samples, base)) ?? base;

  const envelope: CacheEnvelope = {
    updatedAt: new Date().toISOString(),
    personas: refined,
    totalSamples: samples.length,
  };

  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(envelope), updatedBy: "persona-analysis-service" },
    update: { value: JSON.stringify(envelope), updatedBy: "persona-analysis-service" },
  });

  return envelope;
}

/**
 * 캐시 우선 조회. 없으면 즉시 재계산.
 */
export async function getOrGeneratePersonas(): Promise<CacheEnvelope> {
  const cached = await getCachedPersonas();
  if (cached) return cached;
  return regeneratePersonas();
}
