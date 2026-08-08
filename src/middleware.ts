import { NextResponse, type NextRequest } from "next/server";
import { checkAdminAuthLimit, isUpstashConfigured } from "@/lib/security/upstash-ratelimit";
import {
  ADMIN_SESSION_COOKIE,
  isAdminSessionConfigured,
  verifyAdminSessionToken
} from "@/lib/security/admin-session";
import { isExperimentalAdminPath } from "@/lib/security/experimental-admin-pages";
import { LOCALE_HEADER, LOCALE_PREFIX, splitLocalePath, isStaticEnRoute } from "@/lib/i18n-locale";

const ADMIN_AUTH_USER_ENV = "ADMIN_BASIC_AUTH_USER";
const ADMIN_AUTH_PASSWORD_ENV = "ADMIN_BASIC_AUTH_PASSWORD";
const ADMIN_REALM = 'Basic realm="admin-office-mvp"';

const KO_AUTH_REQUIRED = "관리자 인증이 필요합니다.";
const KO_AUTH_CONFIG_REQUIRED = "관리자 인증 환경변수 설정이 필요합니다.";
const KO_AUTH_CONFIG_MISSING = "관리자 인증 환경변수가 아직 설정되지 않았습니다.";
const KO_INSECURE_CREDENTIALS =
  "관리자 비밀번호 강도 기준을 충족하지 않아 서비스 보호를 위해 차단되었습니다.";
const KO_AUTH_RATE_LIMITED = "인증 실패가 반복되어 잠시 차단되었습니다. 잠시 후 다시 시도해 주세요.";
const KO_ORIGIN_REJECTED = "허용되지 않은 출처에서 관리자 API 변경 요청이 들어와 차단되었습니다.";
const KO_IP_REJECTED = "허용된 접속 IP가 아니어서 차단되었습니다.";
const KO_HTTPS_REQUIRED = "보안 연결(HTTPS)로만 접속할 수 있습니다.";

type Credentials = {
  username: string;
  password: string;
};

type FailedAuthEntry = {
  count: number;
  resetAt: number;
};

type MiddlewareGlobal = typeof globalThis & {
  __adminAuthFailMap?: Map<string, FailedAuthEntry>;
  __adminAuthFailMapCleanupAt?: number;
};

const AUTH_FAIL_CLEANUP_MS = 60_000;

function getEnvBoolean(name: string, defaultValue: boolean) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function getEnvInt(name: string, defaultValue: number, min: number, max: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
}

function parseAllowlist(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function isIpAllowed(ip: string, allowlist: string[]) {
  if (allowlist.length === 0) return true;
  if (ip === "unknown") return false;

  return allowlist.some((candidate) => {
    if (candidate.endsWith("*")) {
      return ip.startsWith(candidate.slice(0, -1));
    }
    return ip === candidate;
  });
}

function getAuthFailMap() {
  const state = globalThis as MiddlewareGlobal;
  if (!state.__adminAuthFailMap) {
    state.__adminAuthFailMap = new Map();
  }
  return state.__adminAuthFailMap;
}

function cleanupExpiredFailEntries(now: number) {
  const state = globalThis as MiddlewareGlobal;
  const nextCleanupAt = state.__adminAuthFailMapCleanupAt ?? 0;
  if (now < nextCleanupAt) return;

  const failMap = getAuthFailMap();
  for (const [key, value] of failMap.entries()) {
    if (value.resetAt <= now) {
      failMap.delete(key);
    }
  }

  state.__adminAuthFailMapCleanupAt = now + AUTH_FAIL_CLEANUP_MS;
}

function constantTimeEquals(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length === rightBytes.length ? 0 : 1;

  for (let index = 0; index < length; index += 1) {
    const l = leftBytes[index] ?? 0;
    const r = rightBytes[index] ?? 0;
    mismatch |= l ^ r;
  }

  return mismatch === 0;
}

function parseBasicAuthorization(header: string | null) {
  if (!header || !header.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return null;
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
}

function isStateChangingMethod(method: string) {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function getRequestHost(request: NextRequest) {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
}

function isAllowedOrigin(originHeader: string, request: NextRequest) {
  try {
    const originUrl = new URL(originHeader);
    return originUrl.host === getRequestHost(request);
  } catch {
    return false;
  }
}

function hasPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicRoute(pathname: string) {
  if (pathname === "/") return true;
  if (hasPathPrefix(pathname, "/services")) return true;
  if (hasPathPrefix(pathname, "/intake")) return true;
  if (hasPathPrefix(pathname, "/track")) return true;
  if (hasPathPrefix(pathname, "/api/inquiries")) return true;
  if (hasPathPrefix(pathname, "/api/public/track")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/manifest.json") return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  return false;
}

/** 로그인 화면과 로그인/로그아웃 API는 보호 대상에서 제외(순환 차단 방지). */
export function isAdminAuthRoute(pathname: string) {
  if (pathname === "/admin/login") return true;
  if (hasPathPrefix(pathname, "/api/admin-auth")) return true;
  return false;
}

export function isProtectedAdminRoute(pathname: string) {
  if (isAdminAuthRoute(pathname)) return false;
  if (hasPathPrefix(pathname, "/admin")) return true;
  if (hasPathPrefix(pathname, "/api/admin")) return true;
  return false;
}

function shouldForceHttps(request: NextRequest) {
  const enabled = getEnvBoolean("FORCE_HTTPS", process.env.NODE_ENV === "production");
  if (!enabled) return false;

  const host = getRequestHost(request).toLowerCase();
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return false;

  const proto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  if (proto) {
    return proto !== "https";
  }

  return request.nextUrl.protocol !== "https:";
}

function isStrongPassword(password: string, minimumLength: number) {
  if (password.length < minimumLength) return false;

  let groups = 0;
  if (/[A-Z]/.test(password)) groups += 1;
  if (/[a-z]/.test(password)) groups += 1;
  if (/\d/.test(password)) groups += 1;
  if (/[^A-Za-z0-9]/.test(password)) groups += 1;

  return groups >= 3;
}

function getCredentials() {
  const username = process.env[ADMIN_AUTH_USER_ENV]?.trim();
  const password = process.env[ADMIN_AUTH_PASSWORD_ENV]?.trim();

  if (!username || !password) {
    return null;
  }

  return { username, password } satisfies Credentials;
}

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptPolicy = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const stylePolicy = isDev
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline'"; // inline styles still needed for Tailwind

  return [
    "default-src 'self'",
    `script-src ${scriptPolicy}`,
    `style-src ${stylePolicy}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");
}

function applySecurityHeaders(request: NextRequest, response: NextResponse) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("x-nonce", nonce);

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  if (
    process.env.NODE_ENV === "production" &&
    (request.headers.get("x-forwarded-proto")?.toLowerCase() === "https" || request.nextUrl.protocol === "https:")
  ) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
}

function jsonError(status: number, message: string, request: NextRequest) {
  const response = NextResponse.json({ error: message }, { status });
  applySecurityHeaders(request, response);
  return response;
}

function textError(status: number, message: string, request: NextRequest) {
  const response = new NextResponse(message, { status });
  applySecurityHeaders(request, response);
  return response;
}

function getUnauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.json(
      { error: "Unauthorized", message: KO_AUTH_REQUIRED },
      {
        status: 401,
        headers: { "WWW-Authenticate": ADMIN_REALM }
      }
    );
    applySecurityHeaders(request, response);
    return response;
  }

  // 화면 요청은 브라우저 기본 인증 팝업 대신 로그인 페이지로 보낸다.
  // (세션 비밀키가 없으면 로그인 폼이 동작할 수 없으므로 기존 Basic Auth 팝업 유지)
  if (isAdminSessionConfigured()) {
    const loginUrl = new URL("/admin/login", request.url);
    const target = request.nextUrl.pathname + request.nextUrl.search;
    if (target && target !== "/admin/login") {
      loginUrl.searchParams.set("next", target);
    }
    const redirect = NextResponse.redirect(loginUrl);
    applySecurityHeaders(request, redirect);
    return redirect;
  }

  const response = new NextResponse(KO_AUTH_REQUIRED, {
    status: 401,
    headers: {
      "WWW-Authenticate": ADMIN_REALM,
      // 진단용: Edge 런타임(미들웨어)에서 세션 비밀키가 보이는지 여부만 노출.
      // 값은 절대 싣지 않는다. 폼 로그인이 안 뜰 때 원인 판별에 쓴다.
      "X-Admin-Session-Ready": isAdminSessionConfigured() ? "1" : "0"
    }
  });
  applySecurityHeaders(request, response);
  return response;
}

function getConfigurationMissingResponse(request: NextRequest, message = KO_AUTH_CONFIG_REQUIRED) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return jsonError(503, message, request);
  }
  return textError(503, KO_AUTH_CONFIG_MISSING, request);
}

function getTooManyAttemptsResponse(request: NextRequest, retryAfterSec: number) {
  const response = request.nextUrl.pathname.startsWith("/api/")
    ? NextResponse.json({ error: KO_AUTH_RATE_LIMITED }, { status: 429 })
    : new NextResponse(KO_AUTH_RATE_LIMITED, { status: 429 });
  response.headers.set("Retry-After", String(retryAfterSec));
  applySecurityHeaders(request, response);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldForceHttps(request)) {
    if (request.method === "GET" || request.method === "HEAD") {
      const secureUrl = new URL(request.url);
      secureUrl.protocol = "https:";
      const response = NextResponse.redirect(secureUrl, 308);
      applySecurityHeaders(request, response);
      return response;
    }

    return request.nextUrl.pathname.startsWith("/api/")
      ? jsonError(426, KO_HTTPS_REQUIRED, request)
      : textError(426, KO_HTTPS_REQUIRED, request);
  }

  // 레거시 `?lang=en` → 경로기반 `/en...` 301.
  //
  // 로케일별 정적(ISR) 페이지는 요청 쿼리를 읽을 수 없다. 그래서 정적화한 페이지에
  // `?lang=en` 으로 들어오면 영어가 아니라 **한국어가 그대로 나갔다** — 예전 색인·외부
  // 링크·북마크로 들어온 외국인 방문자가 한국어 페이지를 보게 되는 실제 버그였다.
  // (처음엔 홈만 처리했는데, 이후 about·fees·contact·careers·services 등을 정적화하면서
  //  같은 처리를 확장하지 않아 그대로 새고 있었다.)
  //
  // 정적 EN 라우트를 가진 경로만 옮긴다. 나머지(동적 페이지)는 지금도 getRequestLocale 이
  // `?lang` 을 직접 읽어 EN 을 렌더하므로 건드리지 않는다.
  if (
    request.nextUrl.searchParams.get("lang") === "en" &&
    !pathname.startsWith(LOCALE_PREFIX)
  ) {
    const target = pathname === "/" ? LOCALE_PREFIX : `${LOCALE_PREFIX}${pathname}`;
    if (isStaticEnRoute(target)) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      url.searchParams.delete("lang");
      const response = NextResponse.redirect(url, 301);
      applySecurityHeaders(request, response);
      return response;
    }
  }

  // ── 경로기반 로케일(/en) ─────────────────────────────
  // `/en/<path>` → 내부적으로 `<path>` 로 rewrite 하고 x-ethos-locale=en 헤더를 주입.
  // 서버 컴포넌트는 getRequestLocale()로 이 헤더를 읽어 EN 렌더. `/en/*` 는 절대 admin
  // 경로가 될 수 없으므로 이 블록은 admin 인증 로직과 완전히 분리(안전).
  //
  // 단, 이미 존재하는 app/en 라우트(바로 `/en` 홈, `/en/feed.xml`)는 그대로 두어야
  // 하므로 rewrite 대상에서 제외한다(이들은 아래 matcher 의 `/en/:path*` 에 걸리더라도
  // 실제 파일 라우트가 우선하도록 next() 반환).
  if (pathname.startsWith(LOCALE_PREFIX + "/")) {
    // 정적 /en 라우트(로케일별 정적 ISR)는 파일 라우트가 우선하도록 rewrite 제외.
    if (isStaticEnRoute(pathname)) {
      const response = NextResponse.next();
      applySecurityHeaders(request, response);
      return response;
    }
    const { path } = splitLocalePath(pathname);
    const url = request.nextUrl.clone();
    url.pathname = path;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, "en");
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    applySecurityHeaders(request, response);
    return response;
  }

  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    applySecurityHeaders(request, response);
    return response;
  }

  // 로그인 화면·로그인 API는 인증 대상에서 빼되, IP 허용목록은 그대로 적용한다.
  // (여기서 빠지면 허용목록 밖에서도 비밀번호 대입을 시도할 수 있게 된다.)
  if (isAdminAuthRoute(pathname)) {
    const ip = getClientIp(request);
    if (!isIpAllowed(ip, parseAllowlist(process.env.ADMIN_IP_ALLOWLIST))) {
      return pathname.startsWith("/api/")
        ? jsonError(403, KO_IP_REJECTED, request)
        : textError(403, KO_IP_REJECTED, request);
    }
    const response = NextResponse.next();
    applySecurityHeaders(request, response);
    return response;
  }

  const protectedAdminRoute = isProtectedAdminRoute(pathname);
  if (!protectedAdminRoute) {
    const response = NextResponse.next();
    applySecurityHeaders(request, response);
    return response;
  }

  const clientIp = getClientIp(request);
  const allowlist = parseAllowlist(process.env.ADMIN_IP_ALLOWLIST);
  if (!isIpAllowed(clientIp, allowlist)) {
    return request.nextUrl.pathname.startsWith("/api/")
      ? jsonError(403, KO_IP_REJECTED, request)
      : textError(403, KO_IP_REJECTED, request);
  }

  if (
    pathname.startsWith("/api/admin") &&
    isStateChangingMethod(request.method)
  ) {
    const requireSameOrigin = getEnvBoolean("ADMIN_REQUIRE_SAME_ORIGIN", true);
    const allowMissingOrigin = getEnvBoolean("ADMIN_ALLOW_MISSING_ORIGIN", false);

    if (requireSameOrigin) {
      const origin = request.headers.get("origin");
      const allowed =
        (origin ? isAllowedOrigin(origin, request) : false) || (!origin && allowMissingOrigin);
      if (!allowed) {
        return jsonError(403, KO_ORIGIN_REJECTED, request);
      }
    }
  }

  const credentials = getCredentials();
  if (!credentials) {
    return getConfigurationMissingResponse(request);
  }

  const enforceStrongCredentials = getEnvBoolean("ADMIN_ENFORCE_STRONG_CREDENTIALS", true);
  const minPasswordLength = getEnvInt("ADMIN_MIN_PASSWORD_LENGTH", 14, 10, 64);
  if (enforceStrongCredentials && !isStrongPassword(credentials.password, minPasswordLength)) {
    return getConfigurationMissingResponse(request, KO_INSECURE_CREDENTIALS);
  }

  const maxFailures = getEnvInt("ADMIN_AUTH_RATE_LIMIT_MAX_FAILURES", 20, 5, 200);
  const windowMs = getEnvInt("ADMIN_AUTH_RATE_LIMIT_WINDOW_MS", 10 * 60 * 1000, 60_000, 60 * 60 * 1000);
  const now = Date.now();
  cleanupExpiredFailEntries(now);

  const failMap = getAuthFailMap();
  const currentFail = failMap.get(clientIp);
  if (currentFail && currentFail.resetAt > now && currentFail.count >= maxFailures) {
    const retryAfterSec = Math.max(1, Math.ceil((currentFail.resetAt - now) / 1000));
    return getTooManyAttemptsResponse(request, retryAfterSec);
  }

  // 인가 경로 1: 로그인 폼이 발급한 세션 쿠키.
  // 인가 경로 2: 기존 Basic Auth (자동화·폴백. 세션이 깨져도 잠기지 않도록 유지).
  const sessionUser = await verifyAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  );

  const provided = parseBasicAuthorization(request.headers.get("authorization"));
  const authorized =
    sessionUser !== null ||
    (provided &&
      constantTimeEquals(provided.username, credentials.username) &&
      constantTimeEquals(provided.password, credentials.password));

  if (!authorized) {
    const failEntry =
      currentFail && currentFail.resetAt > now
        ? currentFail
        : {
            count: 0,
            resetAt: now + windowMs
          };

    failEntry.count += 1;
    failMap.set(clientIp, failEntry);

    // 분산 rate limit — Upstash Redis 있으면 인스턴스 간 실패 카운트 공유.
    // 미설정 시 위 in-memory failMap만 동작 (단일 인스턴스만 보호).
    // TODO: Upstash 환경변수 미설정 시 다중 인스턴스(Vercel serverless) 브루트포스 방어 취약.
    if (isUpstashConfigured()) {
      try {
        const distributed = await checkAdminAuthLimit(clientIp);
        if (!distributed.ok) {
          return getTooManyAttemptsResponse(request, 60);
        }
      } catch {
        // Upstash 장애 시 in-memory로 진행
      }
    }

    if (failEntry.count >= maxFailures) {
      const retryAfterSec = Math.max(1, Math.ceil((failEntry.resetAt - now) / 1000));
      return getTooManyAttemptsResponse(request, retryAfterSec);
    }

    return getUnauthorizedResponse(request);
  }

  failMap.delete(clientIp);

  if (pathname === "/") {
    const response = NextResponse.redirect(new URL("/admin", request.url));
    applySecurityHeaders(request, response);
    return response;
  }

  // 실험 페이지 하드 차단 — env 로만 켤 수 있는 상위 스위치.
  //
  // 레이아웃 게이트는 "표시 게이트"라 페이지 서버 컴포넌트가 실행된 뒤 출력만 가려진다.
  // 여기서 막으면 페이지 코드 자체가 실행되지 않는다(DB 조회·외부 호출도 발생 안 함).
  //
  // Edge 런타임은 DB 기능 플래그를 못 읽으므로 env 를 쓴다.
  //   ADMIN_ENABLE_EXPERIMENTAL=true  → 하드 차단 해제(그 뒤 레이아웃의 DB 플래그가 판정)
  //   그 외(기본)                      → 실험 경로는 여기서 안내 페이지로 rewrite
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/api/") &&
    !getEnvBoolean("ADMIN_ENABLE_EXPERIMENTAL", false) &&
    isExperimentalAdminPath(pathname)
  ) {
    const rewritten = NextResponse.rewrite(new URL("/admin/lab-disabled", request.url));
    applySecurityHeaders(request, rewritten);
    return rewritten;
  }

  // 관리자 페이지 라우트는 현재 경로를 요청 헤더로 실어 보낸다.
  // 서버 레이아웃(Node 런타임)이 이 값을 읽어 실험 페이지 게이트를 판정한다
  // (Edge 미들웨어는 DB 기능 플래그를 못 읽으므로 판정은 레이아웃에서 한다).
  if (pathname.startsWith("/admin") && !pathname.startsWith("/api/")) {
    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.set("x-admin-pathname", pathname);
    const response = NextResponse.next({ request: { headers: forwardHeaders } });
    applySecurityHeaders(request, response);
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(request, response);
  return response;
}

export const config = {
  matcher: [
    "/",
    "/en/:path*",
    // 레거시 `?lang=en` 301 대상 — STATIC_EN_ROUTES 의 KO 원본 경로.
    // 여기 없으면 미들웨어가 아예 실행되지 않아 리다이렉트가 조용히 새어 나간다
    // (실제로 about·fees·contact·careers 가 그래서 한국어로 나가고 있었다).
    // 새 페이지를 정적화하면 STATIC_EN_ROUTES 와 함께 여기에도 추가할 것
    // — test:i18n-legacy-lang 잠금이 둘의 일치를 검사한다.
    "/about",
    "/fees",
    "/cases",
    "/consult",
    "/contact",
    "/careers",
    "/quick-check",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/admin-auth/:path*",
    "/services/:path*",
    "/intake/:path*",
    "/track/:path*",
    "/api/inquiries/:path*",
    "/api/public/track"
  ]
};
