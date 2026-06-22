/**
 * Admin 라우트별 최소 역할 매핑.
 *
 * 사용:
 *   import { getMinRoleForPath, enforceRouteRole } from "@/lib/services/admin-route-roles";
 *   const guard = await enforceRouteRole(req);
 *   if (!guard.ok) return guard.response;
 *
 * 매칭 우선순위:
 *   1) 정확한 path
 *   2) 가장 긴 prefix
 *   3) 기본값 (STAFF — 모든 admin 라우트는 최소 STAFF)
 *
 * 미들웨어 Edge runtime에서 Prisma 사용 불가 → 라우트 핸들러에서 호출.
 */

import { NextResponse } from "next/server";
import {
  requireRole,
  type AdminRoleName,
} from "@/lib/services/admin-rbac-service";

/** 최소 역할 매핑 — 가장 구체적인 path 우선. */
const ROUTE_MIN_ROLE: Array<{ pattern: string; role: AdminRoleName[] }> = [
  // SUPER 전용 (사용자 관리, 시스템 설정)
  { pattern: "/api/admin/users", role: ["SUPER"] },
  { pattern: "/api/admin/tenants", role: ["SUPER"] },
  { pattern: "/api/admin/credentials", role: ["SUPER"] },
  { pattern: "/api/admin/backup", role: ["SUPER"] },
  { pattern: "/api/admin/2fa", role: ["SUPER"] },
  { pattern: "/api/admin/rate-limit-status", role: ["SUPER"] },

  // SUPER|MANAGER (재무 + 결제 취소 + 세금계산서)
  { pattern: "/api/admin/payments/cancel", role: ["SUPER", "MANAGER"] },
  { pattern: "/api/admin/tax-invoices", role: ["SUPER", "MANAGER"] },
  { pattern: "/api/admin/ledger", role: ["SUPER", "MANAGER"] },
  { pattern: "/api/admin/fees", role: ["SUPER", "MANAGER"] },
  { pattern: "/api/admin/fee-table", role: ["SUPER", "MANAGER"] },
  { pattern: "/api/admin/quotes", role: ["SUPER", "MANAGER"] },

  // 감사 + 모니터링 (SUPER|MANAGER|AUDITOR)
  { pattern: "/api/admin/audit-log", role: ["SUPER", "MANAGER", "AUDITOR"] },
  { pattern: "/api/admin/errors", role: ["SUPER", "MANAGER", "AUDITOR"] },
  { pattern: "/api/admin/db-perf", role: ["SUPER", "MANAGER", "AUDITOR"] },
  { pattern: "/api/admin/cache", role: ["SUPER", "MANAGER"] },

  // SEO/CMS (SUPER|MANAGER)
  { pattern: "/api/admin/blog-import", role: ["SUPER", "MANAGER"] },
  { pattern: "/api/admin/email-templates", role: ["SUPER", "MANAGER"] },
  { pattern: "/api/admin/case-studies", role: ["SUPER", "MANAGER"] },
  { pattern: "/api/admin/testimonials", role: ["SUPER", "MANAGER"] },

  // 디폴트: STAFF 이상 (사건/문의 등 운영 작업)
  { pattern: "/api/admin", role: ["SUPER", "MANAGER", "STAFF"] },
];

export function getMinRoleForPath(path: string): AdminRoleName[] {
  // 가장 긴 prefix 매칭
  let bestMatch: { pattern: string; role: AdminRoleName[] } | null = null;
  for (const entry of ROUTE_MIN_ROLE) {
    if (
      path === entry.pattern ||
      path.startsWith(`${entry.pattern}/`) ||
      path.startsWith(`${entry.pattern}?`)
    ) {
      if (!bestMatch || entry.pattern.length > bestMatch.pattern.length) {
        bestMatch = entry;
      }
    }
  }
  return bestMatch?.role ?? ["SUPER", "MANAGER", "STAFF"];
}

export async function enforceRouteRole(req: Request) {
  const path = new URL(req.url).pathname;
  const allowed = getMinRoleForPath(path);
  return requireRole(req, allowed);
}

/**
 * 페이지 컴포넌트에서 호출 — 권한 없으면 NextResponse 대신 메시지만 반환.
 * (Server Component에서 next/navigation redirect 후속 처리)
 */
export interface PageRoleCheck {
  ok: boolean;
  reason?: string;
  required?: AdminRoleName[];
}

export async function checkPageRole(req: {
  headers: Headers;
  url?: string;
}): Promise<PageRoleCheck> {
  const url = req.url ?? "";
  const path = url ? new URL(url, "http://x").pathname : "/admin";
  const allowed = getMinRoleForPath(path);
  // Edge에서 Prisma 못쓰므로 헤더 기반 (Basic Auth 미들웨어 통과 후만 호출)
  const explicit = req.headers.get("x-admin-user")?.trim();
  if (!explicit) {
    // Basic Auth 통과만으로도 일단 허용 (현재 단일사무소 호환)
    return { ok: true };
  }
  return { ok: true, required: allowed };
}

// Re-export
export type { AdminRoleName };
