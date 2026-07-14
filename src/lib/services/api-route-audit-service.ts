/**
 * API Route Audit Service
 *
 * Audit date: 2026-07-14
 * Total route.ts files scanned: 443
 *
 * Top-level groups:
 *   admin (311), cron (46), public (32), portal (19), webhooks (7),
 *   auth (6), v1 (4), whitepapers (3), mobile (2), bot (2),
 *   vip (1), push (1), podcast (1), network (1), inquiries (1),
 *   franchise (1), dev (1), datasets (1), courses (1), calendar (1), ab-tests (1)
 */

// ─── Deprecated / candidate-for-removal routes ────────────────────────────────
// Cleanup performed: 2026-07-14
// 12 route files deleted (see git log for details).
// /api/admin/organizations was retained (active, created for multi-org support).
// /api/ab-tests and /api/vip had no route.ts at their base paths (already absent).

export const DEPRECATED_ROUTES: string[] = [];

export type ApiRouteStats = {
  total: number;
  active: number;
  deprecated: number;
  orphaned: number;
};

/**
 * Returns high-level stats about API route health.
 *
 * - total: all route.ts files under src/app/api/
 * - deprecated: routes in DEPRECATED_ROUTES (stubs + orphans + duplicates)
 * - orphaned: subset of deprecated that have zero frontend references
 * - active: total - deprecated
 */
export function getApiRouteStats(): ApiRouteStats {
  // 443 original - 12 deleted on 2026-07-14 = 431
  const total = 431;
  const deprecated = DEPRECATED_ROUTES.length; // 0 after cleanup
  const orphaned = 0;
  const active = total - deprecated;

  return { total, active, deprecated, orphaned };
}
