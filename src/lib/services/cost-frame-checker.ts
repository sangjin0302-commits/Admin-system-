/**
 * 비용 3단 구조 검증 서비스 (v6.4 §8-8-2)
 *
 * 블로그가 "비용" 또는 "만원"을 언급할 때, 다음 세 요소가 모두 존재해야 한다:
 *  1) 범위 언급  (예: "30만원~50만원", "20~30만원")
 *  2) 조건 언급  (예: "사안에 따라 다릅니다")
 *  3) 개별 확인 (예: "무료 검토", "개별 상담")
 */

export type CostFrameElement = "range" | "condition" | "individualCheck";

export type CostFrameResult = {
  applicable: boolean;
  hasRange: boolean;
  hasCondition: boolean;
  hasIndividualCheck: boolean;
  hasAll: boolean;
  missing: CostFrameElement[];
};

const RANGE_PATTERNS: RegExp[] = [
  /\d+\s*만원\s*[~\-–—]\s*\d+\s*만원/u, // 30만원~50만원
  /\d+\s*[~\-–—]\s*\d+\s*만원/u,        // 30~50만원
  /\d+\s*만원\s*(이상|이하|내외|안팎|정도|수준)/u,
];

const CONDITION_KEYWORDS = [
  "따라 다릅니다",
  "따라 다를 수",
  "사안에 따라",
  "케이스에 따라",
  "상황에 따라",
  "조건에 따라",
  "달라질 수 있",
];

const INDIVIDUAL_KEYWORDS = [
  "개별",
  "무료 검토",
  "무료검토",
  "무료 상담",
  "무료상담",
  "개별 상담",
  "1:1 상담",
];

const TRIGGER_KEYWORDS = ["비용", "만원"];

/** 비용 관련 언급이 있는지. */
export function mentionsCost(text: string): boolean {
  return TRIGGER_KEYWORDS.some((k) => text.includes(k));
}

export function hasRangeMention(text: string): boolean {
  if (RANGE_PATTERNS.some((re) => re.test(text))) return true;
  // fallback: "~" 자체가 붙은 만원 표현
  if (/만원.*[~〜]/u.test(text) || /[~〜].*만원/u.test(text)) return true;
  return false;
}

export function hasConditionMention(text: string): boolean {
  return CONDITION_KEYWORDS.some((k) => text.includes(k));
}

export function hasIndividualCheck(text: string): boolean {
  return INDIVIDUAL_KEYWORDS.some((k) => text.includes(k));
}

/** 비용 3단 구조 검증. applicable=false 면 검증 대상이 아님. */
export function validateCostFrame(text: string | null | undefined): CostFrameResult {
  const body = text ?? "";
  const applicable = mentionsCost(body);
  const hasRange = hasRangeMention(body);
  const hasCondition = hasConditionMention(body);
  const hasIndividual = hasIndividualCheck(body);
  const missing: CostFrameElement[] = [];
  if (applicable) {
    if (!hasRange) missing.push("range");
    if (!hasCondition) missing.push("condition");
    if (!hasIndividual) missing.push("individualCheck");
  }
  return {
    applicable,
    hasRange,
    hasCondition,
    hasIndividualCheck: hasIndividual,
    hasAll: applicable ? missing.length === 0 : true,
    missing,
  };
}

/** guideline-audit 결과에 병합할 수 있는 요약 라인. */
export function costFrameAuditSummary(result: CostFrameResult): string | null {
  if (!result.applicable) return null;
  if (result.hasAll) return "비용 3단 구조 (범위·조건·개별확인) 충족";
  const labels: Record<CostFrameElement, string> = {
    range: "범위 언급",
    condition: "조건 언급",
    individualCheck: "개별 확인",
  };
  return `비용 3단 구조 누락: ${result.missing.map((m) => labels[m]).join(", ")}`;
}
