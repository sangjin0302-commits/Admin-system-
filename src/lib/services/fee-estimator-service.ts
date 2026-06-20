import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type FeeTableEntry = { min: number; max: number; note?: string };
export type FeeTable = Record<string, Record<string, FeeTableEntry>>;

export const DEFAULT_FEE_TABLE = {
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
} as const satisfies FeeTable;

export type FeeCategory = keyof typeof DEFAULT_FEE_TABLE;

export const DEFAULT_ADJUSTMENTS = {
  urgencyHigh: 1.3,
  urgencyCritical: 1.5,
  complexity: 1.4,
  company: 1.2,
};

export type FeeAdjustments = typeof DEFAULT_ADJUSTMENTS;

const FEE_TABLE_KEY = "fee.table.custom";
const FEE_ADJ_KEY = "fee.adjustments.custom";

/**
 * @deprecated Use getFeeTable() for the current (possibly admin-edited) table.
 * Retained as an alias for default values.
 */
export const FEE_TABLE = DEFAULT_FEE_TABLE;

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

export async function getFeeTable(): Promise<FeeTable> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: FEE_TABLE_KEY } });
    if (!row) return JSON.parse(JSON.stringify(DEFAULT_FEE_TABLE)) as FeeTable;
    const parsed = JSON.parse(row.value) as FeeTable;
    // merge: ensure all default categories present
    const merged: FeeTable = JSON.parse(JSON.stringify(DEFAULT_FEE_TABLE)) as FeeTable;
    for (const [cat, services] of Object.entries(parsed)) {
      merged[cat] = { ...(merged[cat] ?? {}), ...services };
    }
    return merged;
  } catch (err) {
    logger.error("getFeeTable failed, returning defaults:", err);
    return JSON.parse(JSON.stringify(DEFAULT_FEE_TABLE)) as FeeTable;
  }
}

export async function saveFeeTable(table: FeeTable): Promise<void> {
  const value = JSON.stringify(table);
  await prisma.siteSetting.upsert({
    where: { key: FEE_TABLE_KEY },
    update: { value },
    create: { key: FEE_TABLE_KEY, value },
  });
}

export async function resetFeeTable(): Promise<void> {
  await prisma.siteSetting.deleteMany({ where: { key: FEE_TABLE_KEY } });
}

export async function getAdjustments(): Promise<FeeAdjustments> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: FEE_ADJ_KEY } });
    if (!row) return { ...DEFAULT_ADJUSTMENTS };
    const parsed = JSON.parse(row.value) as Partial<FeeAdjustments>;
    return { ...DEFAULT_ADJUSTMENTS, ...parsed };
  } catch (err) {
    logger.error("getAdjustments failed, returning defaults:", err);
    return { ...DEFAULT_ADJUSTMENTS };
  }
}

export async function saveAdjustments(adj: FeeAdjustments): Promise<void> {
  const value = JSON.stringify(adj);
  await prisma.siteSetting.upsert({
    where: { key: FEE_ADJ_KEY },
    update: { value },
    create: { key: FEE_ADJ_KEY, value },
  });
}

export async function resetAdjustments(): Promise<void> {
  await prisma.siteSetting.deleteMany({ where: { key: FEE_ADJ_KEY } });
}

const CATEGORY_KEYWORDS: { category: string; service: string; keywords: string[] }[] = [
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

function pickByKeyword(text: string, table: FeeTable): { category: string; service: string } {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      if (table[entry.category]?.[entry.service]) {
        return { category: entry.category, service: entry.service };
      }
    }
  }
  // fallback: first category/service in table
  const firstCat = Object.keys(table)[0] ?? "VISA_STAY";
  const firstSvc = Object.keys(table[firstCat] ?? {})[0] ?? "체류기간 연장";
  return { category: firstCat, service: firstSvc };
}

function getBaseRange(
  table: FeeTable,
  category: string,
  service: string,
): { min: number; max: number } | null {
  const group = table[category];
  if (!group) return null;
  return group[service] ?? null;
}

function applyAdjustments(
  base: { min: number; max: number },
  input: FeeEstimateInput,
  adj: FeeAdjustments,
): { adjusted: { min: number; max: number }; adjustments: { reason: string; factor: number }[] } {
  const adjustments: { reason: string; factor: number }[] = [];
  let multiplier = 1;

  if (input.urgency === "HIGH") {
    adjustments.push({ reason: `긴급 처리 (HIGH)`, factor: adj.urgencyHigh });
    multiplier *= adj.urgencyHigh;
  } else if (input.urgency === "CRITICAL") {
    adjustments.push({ reason: `최우선 긴급 처리 (CRITICAL)`, factor: adj.urgencyCritical });
    multiplier *= adj.urgencyCritical;
  }

  if (input.clientType === "COMPANY") {
    adjustments.push({ reason: `법인 의뢰인`, factor: adj.company });
    multiplier *= adj.company;
  }

  if (input.hasComplexFactors) {
    adjustments.push({ reason: `복잡 요소 포함`, factor: adj.complexity });
    multiplier *= adj.complexity;
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
  table: FeeTable,
): Promise<{ category: string; service: string; confidence: number; reasoning: string } | null> {
  const categoryList = Object.entries(table)
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

  if (!table[parsed.category]) return null;
  if (!table[parsed.category][parsed.serviceName]) return null;

  return {
    category: parsed.category,
    service: parsed.serviceName,
    confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.7)),
    reasoning: parsed.reasoning ?? "",
  };
}

export async function estimateFee(input: FeeEstimateInput): Promise<FeeEstimate> {
  const [table, adj] = await Promise.all([getFeeTable(), getAdjustments()]);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let category: string;
  let service: string;
  let confidence = 0.5;
  let reasoning = "";

  if (apiKey) {
    try {
      const ai = await classifyWithAI(apiKey, input, table);
      if (ai) {
        category = ai.category;
        service = ai.service;
        confidence = ai.confidence;
        reasoning = ai.reasoning;
      } else {
        const fallback = pickByKeyword(input.description, table);
        category = fallback.category;
        service = fallback.service;
        confidence = 0.45;
        reasoning = "AI 분류 결과를 사용할 수 없어 키워드 기반으로 추정했습니다.";
      }
    } catch (err) {
      logger.error("Fee AI classification failed, falling back to keyword:", err);
      const fallback = pickByKeyword(input.description, table);
      category = fallback.category;
      service = fallback.service;
      confidence = 0.45;
      reasoning = "AI 호출에 실패하여 키워드 기반으로 추정했습니다.";
    }
  } else {
    const fallback = pickByKeyword(input.description, table);
    category = fallback.category;
    service = fallback.service;
    confidence = 0.5;
    reasoning = "키워드 기반 추정 (AI 미사용).";
  }

  const base = getBaseRange(table, category, service) ?? { min: 500000, max: 1500000 };
  const { adjusted, adjustments } = applyAdjustments(base, input, adj);
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

export async function getMarketBenchmark(): Promise<FeeTable> {
  return getFeeTable();
}
