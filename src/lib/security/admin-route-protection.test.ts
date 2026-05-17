import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isProtectedAdminRoute, isPublicRoute } from "../../../middleware";

const publicRoutes = [
  "/",
  "/services",
  "/services/visa",
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

const middlewareSource = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
assert.match(middlewareSource, /hasPathPrefix\(pathname, "\/track"\)/);
assert.match(middlewareSource, /hasPathPrefix\(pathname, "\/api\/public\/track"\)/);
assert.match(middlewareSource, /hasPathPrefix\(pathname, "\/admin"\)/);
assert.match(middlewareSource, /hasPathPrefix\(pathname, "\/api\/admin"\)/);
assert.match(middlewareSource, /"\/track\/:path\*"/);
assert.match(middlewareSource, /"\/api\/public\/track"/);

console.log("admin route protection tests passed");
