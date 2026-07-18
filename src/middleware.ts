import { NextResponse, type NextRequest } from "next/server";
import { checkAdminAuthLimit, isUpstashConfigured } from "@/lib/security/upstash-ratelimit";
import {
  ADMIN_SESSION_COOKIE,
  isAdminSessionConfigured,
  verifyAdminSessionToken
} from "@/lib/security/admin-session";

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

  const response = NextResponse.next();
  applySecurityHeaders(request, response);
  return response;
}

export const config = {
  matcher: [
    "/",
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
