import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isAdminAuthRoute, isProtectedAdminRoute, isPublicRoute } from "../../middleware";

const publicRoutes = [
  "/",
  "/services",
  "/services/immigration",
  "/intake",
  "/intake?lang=en",
  "/track",
  "/track/help",
  "/api/inquiries",
  "/api/public/track",
  "/_next/static/chunk.js",
  "/favicon.ico",
  "/manifest.json",
  "/icons/icon-192.png"
];

for (const route of publicRoutes) {
  const pathname = route.split("?")[0] ?? route;
  assert.equal(isPublicRoute(pathname), true, `${route} should be public`);
  assert.equal(isProtectedAdminRoute(pathname), false, `${route} should not require admin auth`);
}

const protectedRoutes = [
  "/admin",
  "/admin/document-lab",
  "/admin/inquiries",
  "/admin/intake-sources",
  "/admin/ledger",
  "/admin/inquiries/example-id/lawbot-review",
  "/api/admin",
  "/api/admin/system/health",
  "/api/admin/ledger/export",
  "/api/admin/inquiries/example-id/status",
  "/api/admin/case-matters/example-id/tasks",
  "/api/admin/case-matters/example-id/tasks/task-id",
  "/api/admin/case-matters/example-id/accounting",
  "/api/admin/case-matters/example-id/immigration-detail",
  "/api/admin/case-matters/example-id/notion-export/dry-run",
  "/api/admin/case-matters/example-id/supplement-requests",
  "/api/admin/case-matters/example-id/supplement-requests/supplement-id"
];

for (const route of protectedRoutes) {
  assert.equal(isPublicRoute(route), false, `${route} should not be public`);
  assert.equal(isProtectedAdminRoute(route), true, `${route} should require admin auth`);
}

const similarButPublicRoutes = ["/administrator", "/administer", "/api/administrator"];
for (const route of similarButPublicRoutes) {
  assert.equal(isProtectedAdminRoute(route), false, `${route} should not match admin prefix`);
}

// 로그인 화면과 로그인 API는 인증 대상에서 제외되어야 한다.
// (제외되지 않으면 로그인하러 가는 요청까지 차단되어 순환에 빠진다.)
const adminAuthRoutes = ["/admin/login", "/api/admin-auth/login", "/api/admin-auth/logout"];
for (const route of adminAuthRoutes) {
  assert.equal(isAdminAuthRoute(route), true, `${route} should be an admin auth route`);
  assert.equal(isProtectedAdminRoute(route), false, `${route} must not require admin auth`);
}

// 이름만 비슷한 admin 하위 경로가 로그인 예외로 새어나가면 안 된다.
const notAdminAuthRoutes = ["/admin/login-history", "/admin/logins"];
for (const route of notAdminAuthRoutes) {
  assert.equal(isAdminAuthRoute(route), false, `${route} must not bypass admin auth`);
  assert.equal(isProtectedAdminRoute(route), true, `${route} should still require admin auth`);
}

// /api/admin-auth 예외가 /api/admin- 로 시작하는 다른 경로까지 열지 않아야 한다.
// (이들은 /api/admin 접두사에도 걸리지 않으므로 admin 경로 자체가 아니다 — /administrator와 동일.)
for (const route of ["/api/admin-authority", "/api/admin-authx"]) {
  assert.equal(isAdminAuthRoute(route), false, `${route} must not match admin auth prefix`);
}

const middlewareSource = readFileSync(join(process.cwd(), "src", "middleware.ts"), "utf8");
assert.match(middlewareSource, /hasPathPrefix\(pathname, "\/track"\)/);
assert.match(middlewareSource, /hasPathPrefix\(pathname, "\/api\/public\/track"\)/);
assert.match(middlewareSource, /hasPathPrefix\(pathname, "\/admin"\)/);
assert.match(middlewareSource, /hasPathPrefix\(pathname, "\/api\/admin"\)/);
assert.match(middlewareSource, /"\/track\/:path\*"/);
assert.match(middlewareSource, /"\/api\/public\/track"/);

console.log("admin route protection tests passed");
