import { headers } from "next/headers";
import { LOCALE_HEADER, normalizeLocale, type PublicLocale } from "@/lib/i18n-locale";

/**
 * 서버 컴포넌트에서 현재 요청의 공개 로케일 판별(경로기반).
 *
 * 미들웨어가 `/en/*` 요청을 rewrite 하며 x-ethos-locale 헤더를 주입한다.
 * 이를 우선 읽고, 없으면 레거시 `?lang=en` 쿼리로 폴백(마이그레이션 과도기 호환).
 *
 * 주의: headers()/searchParams 읽기는 동적 렌더를 유발한다. ISR 정적화는 후속
 * 단계(로케일별 정적 경로)에서 처리 — 이 헬퍼는 과도기용 통합 판별점이다.
 */
export async function getRequestLocale(legacyLangParam?: string): Promise<PublicLocale> {
  try {
    const h = await headers();
    const fromHeader = h.get(LOCALE_HEADER);
    if (fromHeader) return normalizeLocale(fromHeader);
  } catch {
    /* headers() 사용 불가 컨텍스트 → 폴백 */
  }
  return normalizeLocale(legacyLangParam);
}

/**
 * 레거시 `?lang=en` 로 접근했는지 판별(경로기반 301 유도용).
 *
 * true 면 호출 측에서 `/en<path>` 로 redirect 하여 정본(canonical)을 경로기반으로 통일한다.
 * `/en/*` 로 이미 서빙 중(미들웨어가 헤더 주입)이면 false → 리다이렉트 루프 방지.
 * 정적 경로 페이지에서만 사용(동적 [slug] 는 스킵 권장).
 */
export async function isLegacyLangEn(legacyLangParam?: string): Promise<boolean> {
  if (legacyLangParam !== "en") return false;
  try {
    const h = await headers();
    if (h.get(LOCALE_HEADER)) return false; // 이미 /en 경로로 서빙 중 → 리다이렉트 불필요
  } catch {
    /* headers() 사용 불가 컨텍스트 → 레거시로 간주 */
  }
  return true;
}
