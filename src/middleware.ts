import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASIC_AUTH_REALM = "Admin Console";
const ADMIN_USER_ENV = "ADMIN_BASIC_AUTH_USER";
const ADMIN_PASSWORD_ENV = "ADMIN_BASIC_AUTH_PASSWORD";
const MARKETING_SYNC_TOKEN_ENV = "ADMIN_MARKETING_SYNC_TOKEN";

function getAdminCredentials() {
  const username = process.env[ADMIN_USER_ENV]?.trim();
  const password = process.env[ADMIN_PASSWORD_ENV]?.trim();

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function parseBasicAuthHeader(value: string | null) {
  if (!value || !value.startsWith("Basic ")) {
    return null;
  }

  const encoded = value.slice("Basic ".length).trim();
  if (!encoded) {
    return null;
  }

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator <= 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1)
    };
  } catch {
    return null;
  }
}

function isValidAdminBasicAuth(request: NextRequest, expected: { username: string; password: string }) {
  const parsed = parseBasicAuthHeader(request.headers.get("authorization"));
  if (!parsed) {
    return false;
  }
  return parsed.username === expected.username && parsed.password === expected.password;
}

function isMarketingIngestByToken(request: NextRequest) {
  if (request.nextUrl.pathname !== "/api/admin/marketing/ingest") {
    return false;
  }

  const expected = process.env[MARKETING_SYNC_TOKEN_ENV]?.trim();
  if (!expected) {
    return false;
  }

  const provided = request.headers.get("x-admin-sync-token")?.trim();
  return Boolean(provided && provided === expected);
}

function adminUnauthorizedPageResponse() {
  return new NextResponse("관리자 인증이 필요합니다.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store"
    }
  });
}

function adminUnauthorizedApiResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: "관리자 인증이 필요합니다.",
      code: "ADMIN_AUTH_REQUIRED"
    },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`,
        "Cache-Control": "no-store"
      }
    }
  );
}

function adminNotConfiguredResponse(isApiRequest: boolean) {
  if (isApiRequest) {
    return NextResponse.json(
      {
        ok: false,
        error: "관리자 인증 환경변수가 설정되지 않았습니다.",
        code: "ADMIN_AUTH_NOT_CONFIGURED"
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return new NextResponse("관리자 인증 환경변수가 설정되지 않았습니다.", {
    status: 503,
    headers: { "Cache-Control": "no-store" }
  });
}

function detectLanguageRedirect(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  // Only apply to public routes (not admin, api, portal)
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/portal")
  ) {
    return null;
  }

  // Skip if lang param already present
  if (request.nextUrl.searchParams.has("lang")) {
    return null;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return null;

  // Parse primary language preference
  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.replace("q=", "")) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferred) {
    if (lang.startsWith("en")) {
      const url = request.nextUrl.clone();
      url.searchParams.set("lang", "en");
      return NextResponse.redirect(url);
    }
    if (lang.startsWith("ar")) {
      const url = request.nextUrl.clone();
      url.searchParams.set("lang", "ar");
      return NextResponse.redirect(url);
    }
    // If Korean or default, no redirect needed
    if (lang.startsWith("ko")) {
      return null;
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // --- Accept-Language auto-detection for public routes ---
  const langRedirect = detectLanguageRedirect(request);
  if (langRedirect) return langRedirect;

  // --- Admin auth: only /admin/* and /api/admin/* ---
  const isAdminPage = pathname.startsWith("/admin");
  const isApiRequest = pathname.startsWith("/api/admin/");
  if (!isAdminPage && !isApiRequest) {
    return NextResponse.next();
  }

  if (isMarketingIngestByToken(request)) {
    return NextResponse.next();
  }

  const credentials = getAdminCredentials();
  if (!credentials) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.next();
    }
    return adminNotConfiguredResponse(isApiRequest);
  }

  if (!isValidAdminBasicAuth(request, credentials)) {
    return isApiRequest ? adminUnauthorizedApiResponse() : adminUnauthorizedPageResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    // Public routes for Accept-Language detection
    "/",
    "/((?!_next|favicon\\.ico|icons|images|manifest).*)"
  ]
};
