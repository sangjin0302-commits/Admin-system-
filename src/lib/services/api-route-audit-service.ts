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
// These routes are stubs (TODO-only, placeholder responses, or empty handlers),
// have zero frontend/service references, or duplicate functionality elsewhere.
// NONE have been deleted -- this list is informational for cleanup planning.

export const DEPRECATED_ROUTES: string[] = [
  // ── Stub routes (TODO / placeholder / hardcoded responses) ──────────────────
  "/api/v1/case-summary",          // Stub: returns first 200 chars, comment says "TODO: Claude Haiku call"
  "/api/v1/citation-verify",       // Stub: regex-only format check, no real verification
  "/api/v1/lawbot/analyze",        // Stub: returns "[STUB]" prefix response, no real AI call

  // ── Zero frontend/service references (orphaned) ─────────────────────────────
  "/api/admin/channel-roi-import", // 0 refs from any component/service; CSV import with no UI
  "/api/admin/guideline-audit",    // 0 refs; full implementation but no page calls it
  "/api/admin/revenue-forecast",   // 0 refs; calls revenue-prediction-service but no UI
  "/api/admin/quote-conversion",   // 0 refs; detailed quote analytics with no consumer
  "/api/admin/kakao-stats",        // 0 refs; kakao delivery dashboard with no UI
  "/api/admin/blog-cross-post",    // 0 refs; cross-posting feature with no UI
  "/api/admin/fee-tracking",       // 0 refs (2 route files); fee tracking with no UI
  "/api/admin/fee-tracking/[caseId]",
  "/api/admin/organizations",      // 0 refs; org management with no consumer
  "/api/ab-tests",                 // Top-level duplicate; admin/ab-tests also exists
  "/api/vip",                      // Top-level; 0 refs, likely superseded by admin/vip or portal

  // ── Feature-flagged but likely never activated ──────────────────────────────
  "/api/admin/lead-scoring",       // 7 lines; thin wrapper, lead-scoring-service may be stub
];

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
  const total = 443;
  const deprecated = DEPRECATED_ROUTES.length;
  const orphaned = 10; // routes with 0 frontend/service references
  const active = total - deprecated;

  return { total, active, deprecated, orphaned };
}
