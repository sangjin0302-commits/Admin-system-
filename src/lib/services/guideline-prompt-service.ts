/**
 * 지침 프롬프트 자동 주입 (LLL8).
 *
 * 관리자에서 편집한 `marketing_guideline_doc` (LLL6) 를 요약해
 * AI 초안 생성 시 시스템 프롬프트 하단에 자동 첨부합니다.
 *
 * Feature flag: `guideline_prompt_inject`.
 * 캐시 60초.
 */

import { getGuidelineDoc } from "@/lib/services/marketing-guideline-doc-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const MAX_SUFFIX_CHARS = 1500;
const CACHE_MS = 60_000;

let _cache: { at: number; suffix: string } | null = null;

/** 캐시 무효화 (지침 저장 시 호출됨). */
export function invalidateGuidelinePromptCache() {
  _cache = null;
}

/**
 * AI 시스템 프롬프트 하단에 붙일 지침 요약 접미사.
 * 플래그 비활성 시 빈 문자열 반환 — 안전하게 append 가능.
 */
export async function getGuidelinePromptSuffix(): Promise<string> {
  try {
    if (!(await isFeatureEnabled("guideline_prompt_inject"))) return "";
  } catch {
    return "";
  }

  if (_cache && Date.now() - _cache.at < CACHE_MS) return _cache.suffix;

  const doc = await getGuidelineDoc().catch(() => null);
  if (!doc || !doc.content.trim()) {
    _cache = { at: Date.now(), suffix: "" };
    return "";
  }

  const trimmed =
    doc.content.length > MAX_SUFFIX_CHARS
      ? doc.content.slice(0, MAX_SUFFIX_CHARS) + "\n…(생략)"
      : doc.content;

  const suffix = `\n\n[사무소 마케팅 지침 ${doc.version} — 반드시 준수]\n${trimmed}\n[지침 끝]`;
  _cache = { at: Date.now(), suffix };
  return suffix;
}

/** 시스템 프롬프트에 지침 접미사를 안전하게 append. */
export async function appendGuidelineToSystem(system: string): Promise<string> {
  const suffix = await getGuidelinePromptSuffix();
  return suffix ? `${system}${suffix}` : system;
}
