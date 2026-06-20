import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export const FEE_TABLE = {
  VISA_STAY: {
    "단기방문(C-3)": { min: 300000, max: 500000 },
    "거주(F-2/F-4)": { min: 1000000, max: 2000000 },
    "영주권(F-5)": { min: 2000000, max: 4000000 },
    "귀화": { min: 3000000, max: 6000000 },
    "체류기간 연장": { min: 150000, max: 300000 },
    "체류자격 변경": { min: 500000, max: 1500000 },
  },
  ADMIN_APPEAL: {
    "강제퇴거 행정심판": { min: 2000000, max: 5000000 },
    "일반 행정심판": { min: 1000000, max: 3000000 },
    "이의신청": { min: 500000, max: 1500000 },
  },
  CONTRACT_INVESTIGATION: {
    "계약서 검토": { min: 200000, max: 500000 },
    "사실조사 보고서": { min: 1000000, max: 3000000 },
  },
  LICENSE_PERMIT: {
    "일반 영업허가": { min: 1000000, max: 3000000 },
    "식품영업 허가": { min: 500000, max: 1500000 },
    "외국인 고용허가": { min: 1000000, max: 2500000 },
  },
  CORPORATE: {
    "주식회사 설립": { min: 300000, max: 500000 },
    "외국인 법인설립": { min: 1000000, max: 2000000 },
  },
  TRANSLATION_NOTARY: {
    "번역(페이지당)": { min: 50000, max: 150000 },
    "아포스티유": { min: 100000, max: 300000 },
    "공증": { min: 50000, max: 200000 },
  },
} as const;

export type FeeCategory = keyof typeof FEE_TABLE;

export type FeeEstimateInput = {
  description: string;
  category?: string;
  urgency?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  clientType?: "INDIVIDUAL" | "COMPANY";
  hasComplexFactors?: boolean;
};

export type FeeEstimate = {
  serviceCategory: string;
  serviceName: string;
  baseRange: { min: number; max: number };
  adjustedRange: { min: number; max: number };
  adjustments: { reason: string; factor: number }[];
  confidence: number;
  reasoning: string;
  similarPastCases?: { caseId: string; title: string; amount: number }[];
};

const CATEGORY_KEYWORDS: { category: FeeCategory; service: string; keywords: string[] }[] = [
  { category: "VISA_STAY", service: "체류기간 연장", keywords: ["연장", "체류연장", "기간연장"] },
  { category: "VISA_STAY", service: "체류자격 변경", keywords: ["자격변경", "체류자격"] },
  { category: "VISA_STAY", service: "영주권(F-5)", keywords: ["영주", "F-5", "f-5"] },
  { category: "VISA_STAY", service: "귀화", keywords: ["귀화", "국적취득"] },
  { category: "VISA_STAY", service: "거주(F-2/F-4)", keywords: ["F-2", "F-4", "거주"] },
  { category: "VISA_STAY", service: "단기방문(C-3)", keywords: ["C-3", "단기"] },
  { category: "ADMIN_APPEAL", service: "강제퇴거 행정심판", keywords: ["강제퇴거", "퇴거"] },
  { category: "ADMIN_APPEAL", service: "이의신청", keywords: ["이의신청"] },
  { category: "ADMIN_APPEAL", service: "일반 행정심판", keywords: ["행정심판", "심판"] },
  { category: "CONTRACT_INVESTIGATION", service: "계약서 검토", keywords: ["계약서", "계약 검토"] },
  { category: "CONTRACT_INVESTIGATION", service: "사실조사 보고서", keywords: ["사실조사", "조사보고"] },
  { category: "LICENSE_PERMIT", service: "외국인 고용허가", keywords: ["고용허가", "외국인 고용"] },
  { category: "LICENSE_PERMIT", service: "식품영업 허가", keywords: ["식품", "음식점"] },
  { category: "LICENSE_PERMIT", service: "일반 영업허가", keywords: ["영업허가", "허가"] },
  { category: "CORPORATE", service: "외국인 법인설립", keywords: ["외국인 법인", "외국법인"] },
  { category: "CORPORATE", service: "주식회사 설립", keywords: ["법인설립", "주식회사", "회사설립"] },
  { category: "TRANSLATION_NOTARY", service: "아포스티유", keywords: ["아포스티유", "apostille"] },
  { category: "TRANSLATION_NOTARY", service: "공증", keywords: ["공증"] },
  { category: "TRANSLATION_NOTARY", service: "번역(페이지당)", keywords: ["번역"] },
];

function pickByKeyword(text: string): { category: FeeCategory; service: string } {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return { category: entry.category, service: entry.service };
    }
  }
  return { category: "VISA_STAY", service: "체류기간 연장" };
}

function getBaseRange(category: FeeCategory, service: string): { min: number; max: number } | null {
  const group = FEE_TABLE[category] as Record<string, { min: number; max: number }>;
  if (!group) return null;
  return group[service] ?? null;
}

function applyAdjustments(
  base: { min: number; max: number },
  input: FeeEstimateInput,
): { adjusted: { min: number; max: number }; adjustments: { reason: string; factor: number }[] } {
  const adjustments: { reason: string; factor: number }[] = [];
  let multiplier = 1;

  if (input.urgency === "HIGH") {
    adjustments.push({ reason: "긴급 처리 (HIGH)", factor: 1.3 });
    multiplier *= 1.3;
  } else if (input.urgency === "CRITICAL") {
    adjustments.push({ reason: "최우선 긴급 처리 (CRITICAL)", factor: 1.5 });
    multiplier *= 1.5;
  }

  if (input.clientType === "COMPANY") {
    adjustments.push({ reason: "법인 의뢰인", factor: 1.2 });
    multiplier *= 1.2;
  }

  if (input.hasComplexFactors) {
    adjustments.push({ reason: "복잡 요소 포함", factor: 1.4 });
    multiplier *= 1.4;
  }

  return {
    adjusted: {
      min: Math.round(base.min * multiplier),
      max: Math.round(base.max * multiplier),
    },
    adjustments,
  };
}

async function classifyWithAI(
  apiKey: string,
  input: FeeEstimateInput,
): Promise<{ category: FeeCategory; service: string; confidence: number; reasoning: string } | null> {
  const categoryList = Object.entries(FEE_TABLE)
    .map(([cat, services]) => `- ${cat}: ${Object.keys(services).join(", ")}`)
    .join("\n");

  const prompt = `행정사 사무소 수임료 견적을 위해 다음 의뢰 내용을 분류하세요.

가능한 카테고리 및 서비스:
${categoryList}

의뢰 설명: ${input.description}
${input.category ? `힌트 카테고리: ${input.category}` : ""}

JSON만 응답: {"category":"카테고리키","serviceName":"정확한 서비스명","confidence":0.0-1.0,"reasoning":"한국어 설명 1-2문장"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]) as {
    category: string;
    serviceName: string;
    confidence: number;
    reasoning: string;
  };

  if (!(parsed.category in FEE_TABLE)) return null;
  const cat = parsed.category as FeeCategory;
  const group = FEE_TABLE[cat] as Record<string, { min: number; max: number }>;
  if (!group[parsed.serviceName]) return null;

  return {
    category: cat,
    service: parsed.serviceName,
    confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.7)),
    reasoning: parsed.reasoning ?? "",
  };
}

export async function estimateFee(input: FeeEstimateInput): Promise<FeeEstimate> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let category: FeeCategory;
  let service: string;
  let confidence = 0.5;
  let reasoning = "";

  if (apiKey) {
    try {
      const ai = await classifyWithAI(apiKey, input);
      if (ai) {
        category = ai.category;
        service = ai.service;
        confidence = ai.confidence;
        reasoning = ai.reasoning;
      } else {
        const fallback = pickByKeyword(input.description);
        category = fallback.category;
        service = fallback.service;
        confidence = 0.45;
        reasoning = "AI 분류 결과를 사용할 수 없어 키워드 기반으로 추정했습니다.";
      }
    } catch (err) {
      logger.error("Fee AI classification failed, falling back to keyword:", err);
      const fallback = pickByKeyword(input.description);
      category = fallback.category;
      service = fallback.service;
      confidence = 0.45;
      reasoning = "AI 호출에 실패하여 키워드 기반으로 추정했습니다.";
    }
  } else {
    const fallback = pickByKeyword(input.description);
    category = fallback.category;
    service = fallback.service;
    confidence = 0.5;
    reasoning = "키워드 기반 추정 (AI 미사용).";
  }

  const base = getBaseRange(category, service) ?? { min: 500000, max: 1500000 };
  const { adjusted, adjustments } = applyAdjustments(base, input);
  const similarPastCases = await getSimilarPastCases(category, 3);

  if (adjustments.length > 0) {
    reasoning += ` 조정 요인 ${adjustments.length}개를 반영했습니다.`;
  }

  return {
    serviceCategory: category,
    serviceName: service,
    baseRange: base,
    adjustedRange: adjusted,
    adjustments,
    confidence,
    reasoning,
    similarPastCases,
  };
}

export async function getSimilarPastCases(
  category: string,
  limit = 5,
): Promise<{ caseId: string; title: string; amount: number }[]> {
  if (!(category in FEE_TABLE)) return [];

  try {
    const rows = await prisma.caseAccountingMemo.findMany({
      where: {
        paidAmount: { gt: 0 },
        caseMatter: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: category as any,
        },
      },
      include: {
        caseMatter: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return rows.map((r) => ({
      caseId: r.caseMatter.id,
      title: r.caseMatter.title,
      amount: r.paidAmount ?? 0,
    }));
  } catch (err) {
    logger.error("getSimilarPastCases failed:", err);
    return [];
  }
}

export function getMarketBenchmark(): typeof FEE_TABLE {
  return FEE_TABLE;
}
