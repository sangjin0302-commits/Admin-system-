/**
 * 마케팅 지침 위반 감지 (v6.4) — 서버 전용 헬퍼.
 *
 * 순수 스캔 로직·상수는 `./marketing-guideline-rules`에 정의 (클라이언트 안전).
 * 이 모듈은 SiteSetting 조회/저장 등 prisma 접근이 필요한 서버 전용 API를 제공합니다.
 *
 * 저장:
 * - SiteSetting key = "marketing_guideline_rules" → 사용자 추가 규칙 JSON 배열
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import {
  FORBIDDEN_PHRASES,
  scanContent,
  getStaticRules,
  type GuidelineRule,
  type GuidelineViolation,
  type Severity,
} from "./marketing-guideline-rules";

export { FORBIDDEN_PHRASES, scanContent, getStaticRules };
export type { GuidelineRule, GuidelineViolation, Severity };

const CUSTOM_RULES_KEY = "marketing_guideline_rules";

/** 사용자 정의 규칙을 SiteSetting에서 조회. */
export async function getCustomRules(): Promise<GuidelineRule[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CUSTOM_RULES_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    const out: GuidelineRule[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      if (typeof r.pattern !== "string" || !r.pattern) continue;
      if (typeof r.reason !== "string") continue;
      const severity: Severity = r.severity === "warn" ? "warn" : "error";
      out.push({
        pattern: r.pattern,
        isRegex: r.isRegex === true,
        reason: r.reason,
        severity,
        suggestion: typeof r.suggestion === "string" ? r.suggestion : undefined,
      });
    }
    return out;
  } catch (err) {
    logger.warn("[marketing-guideline] 사용자 규칙 로드 실패", err);
    return [];
  }
}

/** 사용자 규칙 추가 (append). */
export async function saveCustomRule(rule: GuidelineRule): Promise<GuidelineRule[]> {
  if (!rule.pattern || !rule.reason) {
    throw new Error("pattern·reason 필수");
  }
  const current = await getCustomRules();
  const next = [...current, rule];
  await prisma.siteSetting.upsert({
    where: { key: CUSTOM_RULES_KEY },
    create: { key: CUSTOM_RULES_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

/** 사용자 규칙 삭제 (pattern 기준). */
export async function deleteCustomRule(pattern: string): Promise<GuidelineRule[]> {
  const current = await getCustomRules();
  const next = current.filter((r) => r.pattern !== pattern);
  await prisma.siteSetting.upsert({
    where: { key: CUSTOM_RULES_KEY },
    create: { key: CUSTOM_RULES_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

/** 정적 + 사용자 규칙을 병합해 스캔. */
export async function scanContentWithCustomRules(text: string): Promise<GuidelineViolation[]> {
  const custom = await getCustomRules();
  return scanContent(text, custom);
}
