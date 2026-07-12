/**
 * 텍스트에서 언어를 자동 감지 (Korean / English / Arabic) — 외부 API 미사용, 문자 범위 기반.
 */

export type DetectedLanguage = "ko" | "en" | "ar";

const KOREAN_RANGE = /[가-힯ᄀ-ᇿ㄰-㆏]/g;
const ARABIC_RANGE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const LATIN_RANGE = /[A-Za-z]/g;

export function detectLanguage(text: string): DetectedLanguage {
  if (!text || text.trim().length === 0) return "ko";

  const koCount = (text.match(KOREAN_RANGE) || []).length;
  const arCount = (text.match(ARABIC_RANGE) || []).length;
  const enCount = (text.match(LATIN_RANGE) || []).length;

  const max = Math.max(koCount, arCount, enCount);
  if (max === 0) return "ko";
  if (max === arCount) return "ar";
  if (max === enCount) return "en";
  return "ko";
}
