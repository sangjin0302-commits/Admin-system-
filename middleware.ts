import { NextResponse, type NextRequest } from "next/server";

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

function isProtectedAdminRoute(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/admin")) return true;
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

function buildCsp() {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptPolicy = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptPolicy}`,
    "style-src 'self' 'unsafe-inline'",
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
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Content-Security-Policy", buildCsp());

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

  const response = new NextResponse(KO_AUTH_REQUIRED, {
    status: 401,
    headers: { "WWW-Authenticate": ADMIN_REALM }
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

export function middleware(request: NextRequest) {
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

  const provided = parseBasicAuthorization(request.headers.get("authorization"));
  const authorized =
    provided &&
    constantTimeEquals(provided.username, credentials.username) &&
    constantTimeEquals(provided.password, credentials.password);

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
  matcher: ["/", "/admin/:path*", "/api/admin/:path*", "/intake/:path*", "/api/inquiries"]
};
