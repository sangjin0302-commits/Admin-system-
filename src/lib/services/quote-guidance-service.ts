import type { LawbotResponse } from "@/lib/services/lawbot-case-analysis-types";

// Base rates by category (KRW)
const BASE_RATES: Record<string, { min: number; typical: number; max: number }> = {
  VISA_STAY: { min: 500_000, typical: 1_500_000, max: 3_000_000 },
  ADMIN_APPEAL: { min: 1_500_000, typical: 3_000_000, max: 6_000_000 },
  LICENSE_PERMIT: { min: 800_000, typical: 2_000_000, max: 5_000_000 },
  CONTRACT_INVESTIGATION: { min: 300_000, typical: 800_000, max: 2_000_000 },
  CORPORATE_SETUP: { min: 1_000_000, typical: 2_500_000, max: 5_000_000 },
  DEFAULT: { min: 500_000, typical: 1_500_000, max: 3_500_000 }
};

export type QuoteGuidance = {
  minKrw: number;
  typicalKrw: number;
  maxKrw: number;
  complexityMultiplier: number;
  complexityLabel: "간단" | "보통" | "복잡" | "매우 복잡";
  reasoning: string[];
  categoryUsed: string;
};

export function calculateQuoteGuidance(
  snapshot: LawbotResponse | null,
  category: string | null
): QuoteGuidance {
  const categoryKey = category?.toUpperCase() ?? "DEFAULT";
  const base = BASE_RATES[categoryKey] ?? BASE_RATES.DEFAULT;

  const reasoning: string[] = [];
  let multiplier = 1.0;

  if (snapshot) {
    const issueCount = snapshot.key_issues?.length ?? 0;
    const riskFlagCount = snapshot.risk_flags?.length ?? 0;
    const criticalMissingFacts = snapshot.critical_missing_facts?.length ?? 0;
    const confidence = snapshot.confidence_score ?? 0.5;

    if (issueCount > 3) {
      multiplier += 0.2;
      reasoning.push(`쟁점 ${issueCount}개 → +20%`);
    }
    if (riskFlagCount > 2) {
      multiplier += 0.3;
      reasoning.push(`리스크 플래그 ${riskFlagCount}개 → +30%`);
    }
    if (criticalMissingFacts > 3) {
      multiplier += 0.15;
      reasoning.push(`추가 확인 필요 사실 ${criticalMissingFacts}개 → +15%`);
    }
    if (confidence < 0.4) {
      multiplier += 0.25;
      reasoning.push(`승소가능성 낮음 (신뢰도 ${Math.round(confidence * 100)}%) → +25%`);
    }
  } else {
    reasoning.push("AI 분석 없음 - 기본 요율 적용");
  }

  const complexityLabel: "간단" | "보통" | "복잡" | "매우 복잡" =
    multiplier <= 1.05
      ? "간단"
      : multiplier <= 1.25
        ? "보통"
        : multiplier <= 1.5
          ? "복잡"
          : "매우 복잡";

  return {
    minKrw: Math.round(base.min * multiplier),
    typicalKrw: Math.round(base.typical * multiplier),
    maxKrw: Math.round(base.max * multiplier),
    complexityMultiplier: multiplier,
    complexityLabel,
    reasoning,
    categoryUsed: categoryKey
  };
}
