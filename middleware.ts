import { NextResponse, type NextRequest } from "next/server";

const ADMIN_AUTH_USER_ENV = "ADMIN_BASIC_AUTH_USER";
const ADMIN_AUTH_PASSWORD_ENV = "ADMIN_BASIC_AUTH_PASSWORD";
const ADMIN_REALM = 'Basic realm="admin-office-mvp"';

const KO_AUTH_REQUIRED = "\uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
const KO_AUTH_CONFIG_REQUIRED =
  "ADMIN_BASIC_AUTH_USER / ADMIN_BASIC_AUTH_PASSWORD \uD658\uACBD\uBCC0\uC218 \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
const KO_AUTH_CONFIG_MISSING =
  "\uAD00\uB9AC\uC790 \uC778\uC99D \uD658\uACBD\uBCC0\uC218\uAC00 \uC544\uC9C1 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.";

function getCredentials() {
  const username = process.env[ADMIN_AUTH_USER_ENV]?.trim();
  const password = process.env[ADMIN_AUTH_PASSWORD_ENV]?.trim();

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function isProtectedAdminRoute(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/marketing/ingest") return true;
  return false;
}

function getUnauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized", message: KO_AUTH_REQUIRED },
      {
        status: 401,
        headers: { "WWW-Authenticate": ADMIN_REALM }
      }
    );
  }

  return new NextResponse(KO_AUTH_REQUIRED, {
    status: 401,
    headers: { "WWW-Authenticate": ADMIN_REALM }
  });
}

function getConfigurationMissingResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Admin auth not configured",
        message: KO_AUTH_CONFIG_REQUIRED
      },
      { status: 503 }
    );
  }

  return new NextResponse(KO_AUTH_CONFIG_MISSING, { status: 503 });
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

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"]
};
