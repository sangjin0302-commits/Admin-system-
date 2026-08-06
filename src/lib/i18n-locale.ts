/**
 * 경로기반 로케일 단일 유틸(Task #4 기반).
 *
 * 기존엔 `?lang=en` 쿼리로 로케일을 판별해 공개 페이지가 전부 dynamic 강제됐다.
 * 경로기반(`/en/*`)으로 옮기면 로케일별 정적(ISR) 렌더가 가능해진다.
 *
 * 이 파일은 순수 함수만 — 클라이언트/서버 양쪽에서 import 가능(next 의존 없음).
 * 미들웨어가 `/en/<path>` 요청을 `<path>` 로 rewrite 하며 `x-ethos-locale: en`
 * 헤더를 주입하고, 서버 컴포넌트는 getRequestLocale()(별도)로 이를 읽는다.
 */

export type PublicLocale = "ko" | "en";

export const LOCALE_HEADER = "x-ethos-locale";
export const LOCALE_PREFIX = "/en";

/** 임의 입력 → PublicLocale. "en" 만 en, 그 외 ko. */
export function normalizeLocale(raw: unknown): PublicLocale {
  return raw === "en" ? "en" : "ko";
}

/**
 * pathname 에서 로케일 판별 + 로케일 접두어 제거.
 * "/en/about" → { locale: "en", path: "/about" }
 * "/en"       → { locale: "en", path: "/" }
 * "/about"    → { locale: "ko", path: "/about" }
 */
export function splitLocalePath(pathname: string): { locale: PublicLocale; path: string } {
  if (pathname === LOCALE_PREFIX) return { locale: "en", path: "/" };
  if (pathname.startsWith(LOCALE_PREFIX + "/")) {
    return { locale: "en", path: pathname.slice(LOCALE_PREFIX.length) };
  }
  return { locale: "ko", path: pathname };
}

/**
 * 내부 path + 로케일 → 공개 URL 경로.
 * ("/about", "en") → "/en/about"
 * ("/", "en")      → "/en"
 * (path, "ko")     → path (변경 없음)
 */
export function localePath(path: string, locale: PublicLocale): string {
  if (locale !== "en") return path;
  if (path === "/") return LOCALE_PREFIX;
  return LOCALE_PREFIX + path;
}

/** EN 이면 "?lang=en" 쿼리(레거시 링크 빌더 호환). ko 면 빈 문자열. */
export function legacyLangQuery(locale: PublicLocale): string {
  return locale === "en" ? "?lang=en" : "";
}
