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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRequest = pathname.startsWith("/api/admin/");

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
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
