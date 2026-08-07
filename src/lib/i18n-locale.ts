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

/**
 * 실제 app/en/* 정적 라우트가 존재하는 경로 — 미들웨어가 `/en/*` 를 내부 rewrite 할 때
 * 이 경로들은 **제외**한다(파일 라우트가 우선해 로케일별 정적 ISR 로 서빙되도록).
 *
 * 로케일별 정적화(공유 컴포넌트 추출 + /en/<경로> 정적 라우트)를 한 페이지는 여기에 등록.
 * 미등록 경로는 미들웨어가 `/en/<경로>` → `<경로>` rewrite(동적, 헤더 주입)로 처리.
 */
export const STATIC_EN_ROUTES: ReadonlySet<string> = new Set([
  "/en", // 홈(전체 홈 EN, 정적)
  "/en/feed.xml",
  "/en/about",
  "/en/fees",
  "/en/cases",
  "/en/consult",
  "/en/contact",
  "/en/careers",
  "/en/quick-check",
  "/en/services/immigration",
  "/en/services/appeal",
  "/en/services/contract",
  "/en/services/license",
  "/en/services/corporate",
]);

/** 해당 /en 경로가 정적 파일 라우트를 가지는가(미들웨어 rewrite 제외 대상). */
export function isStaticEnRoute(pathname: string): boolean {
  return STATIC_EN_ROUTES.has(pathname);
}

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
