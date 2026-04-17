import { NextResponse, type NextRequest } from "next/server";

const ADMIN_AUTH_USER_ENV = "ADMIN_BASIC_AUTH_USER";
const ADMIN_AUTH_PASSWORD_ENV = "ADMIN_BASIC_AUTH_PASSWORD";
const ADMIN_REALM = 'Basic realm="admin-office-mvp"';

function getCredentials() {
  const username = process.env[ADMIN_AUTH_USER_ENV]?.trim();
  const password = process.env[ADMIN_AUTH_PASSWORD_ENV]?.trim();

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function isProtectedAdminRoute(pathname: string) {
  if (pathname.startsWith("/admin")) {
    return true;
  }

  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/marketing/ingest") {
    return true;
  }

  return false;
}

function getUnauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized", message: "관리자 인증이 필요합니다." },
      {
        status: 401,
        headers: { "WWW-Authenticate": ADMIN_REALM }
      }
    );
  }

  return new NextResponse("관리자 인증이 필요합니다.", {
    status: 401,
    headers: { "WWW-Authenticate": ADMIN_REALM }
  });
}

function getConfigurationMissingResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Admin auth not configured",
        message: "ADMIN_BASIC_AUTH_USER / ADMIN_BASIC_AUTH_PASSWORD 환경변수가 필요합니다."
      },
      { status: 503 }
    );
  }

  return new NextResponse("관리자 인증 환경변수가 아직 설정되지 않았습니다.", { status: 503 });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedAdminRoute(pathname)) {
    return NextResponse.next();
  }

  const credentials = getCredentials();

  if (!credentials) {
    return getConfigurationMissingResponse(request);
  }

  const expectedHeader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  const providedHeader = request.headers.get("authorization");

  if (providedHeader !== expectedHeader) {
    return getUnauthorizedResponse(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
