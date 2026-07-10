/**
 * 마케팅 지침 위반 감지 — 순수 스캔 로직 (클라이언트 안전).
 *
 * 서버 전용 (SiteSetting 조회/저장) 함수는 `marketing-guideline-service.ts` 참고.
 */

export type Severity = "error" | "warn";

export type GuidelineRule = {
  /** 문자열 리터럴 또는 정규식 소스 */
  pattern: string;
  /** 정규식으로 해석할지 여부 (기본: 문자열) */
  isRegex?: boolean;
  reason: string;
  severity: Severity;
  suggestion?: string;
};

export type GuidelineViolation = {
  phrase: string;
  position: number;
  length: number;
  reason: string;
  severity: Severity;
  suggestion?: string;
};

export const FORBIDDEN_PHRASES: readonly GuidelineRule[] = [
  { pattern: "무료 상담을", severity: "error", reason: "v6.4 CTA 규정 위반 — '무료 상담' 금지", suggestion: "무료 검토를" },
  { pattern: "무료 상담", severity: "error", reason: "v6.4 CTA 규정 위반 — '무료 상담' 금지", suggestion: "무료 검토" },
  { pattern: "무조건", severity: "error", reason: "결과 보장 프레임 (행정사법 §3)", suggestion: "가능성은 있습니다" },
  { pattern: "100% 보장", severity: "error", reason: "결과 보장 금지 (행정사법 §3)", suggestion: "결과 보장 안 함" },
  { pattern: "최저가", severity: "error", reason: "결과·가격 프레임 금지", suggestion: "합리적 비용" },
  { pattern: "즉시 해결", severity: "error", reason: "결과 보장 프레임", suggestion: "신속 검토" },
  { pattern: "완벽", severity: "warn", reason: "과장 표현 우려" },
  { pattern: "반드시", severity: "warn", reason: "과장·단정 표현 우려", suggestion: "일반적으로" },
  { pattern: "30분 내 회신", severity: "warn", reason: "지킬 수 없는 회신 시간 약속" },
  { pattern: "24시간 회신", severity: "warn", reason: "지킬 수 없는 회신 시간 약속", suggestion: "영업일 기준 회신" },
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleToRegex(rule: GuidelineRule): RegExp | null {
  try {
    const src = rule.isRegex ? rule.pattern : escapeRegExp(rule.pattern);
    return new RegExp(src, "g");
  } catch {
    return null;
  }
}

/** 텍스트를 스캔해 위반 목록 반환. */
export function scanContent(text: string, extraRules: readonly GuidelineRule[] = []): GuidelineViolation[] {
  if (!text) return [];
  const rules = [...FORBIDDEN_PHRASES, ...extraRules];
  const violations: GuidelineViolation[] = [];
  for (const rule of rules) {
    const re = ruleToRegex(rule);
    if (!re) continue;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      violations.push({
        phrase: match[0],
        position: match.index,
        length: match[0].length,
        reason: rule.reason,
        severity: rule.severity,
        suggestion: rule.suggestion,
      });
      if (match.index === re.lastIndex) re.lastIndex++;
    }
  }
  violations.sort((a, b) => a.position - b.position);
  return violations;
}

/** 관리자 UI 노출용 — 정적 규칙 전체. */
export function getStaticRules(): readonly GuidelineRule[] {
  return FORBIDDEN_PHRASES;
}
