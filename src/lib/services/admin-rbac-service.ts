/**
 * RBAC — 역할 기반 권한 헬퍼.
 *
 * 5개 역할: SUPER / MANAGER / STAFF / EXTERNAL / AUDITOR
 *
 * 사용 예 (API 라우트):
 *   const guard = await requireRole(request, ["SUPER", "MANAGER"]);
 *   if (!guard.ok) return guard.response;
 *   // 통과 → guard.user 사용
 *
 * 감사:
 *   await logAdminAudit({ actorEmail, action: "PAYMENT_CANCEL", resource: "Payment", resourceId, details })
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type AdminRoleName =
  | "SUPER"
  | "MANAGER"
  | "STAFF"
  | "EXTERNAL"
  | "AUDITOR";

export type AdminAuditActionName =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "EXPORT"
  | "PAYMENT_CANCEL"
  | "ESIGN_SEND"
  | "ALIMTALK_SEND"
  | "ROLE_CHANGE"
  | "CONFIG_CHANGE";

/**
 * 권한 계층 — 상위가 하위를 포함:
 *   SUPER ⊃ MANAGER ⊃ STAFF
 *   AUDITOR (read-only 별도 분기)
 *   EXTERNAL (지정 사건만)
 */
const ROLE_HIERARCHY: Record<AdminRoleName, number> = {
  SUPER: 100,
  MANAGER: 75,
  STAFF: 50,
  AUDITOR: 25,
  EXTERNAL: 10,
};

export function hasRole(actual: AdminRoleName, required: AdminRoleName): boolean {
  return ROLE_HIERARCHY[actual] >= ROLE_HIERARCHY[required];
}

export function hasAnyRole(
  actual: AdminRoleName | null | undefined,
  allowed: AdminRoleName[]
): boolean {
  if (!actual) return false;
  return allowed.includes(actual) || allowed.some((r) => hasRole(actual, r));
}

/**
 * 요청에서 actor 식별 — header X-Admin-User (개발용) or
 * Basic Auth username (단일사무소 운영 호환).
 * 향후 NextAuth 세션으로 교체.
 */
async function resolveActor(req: Request): Promise<{
  email: string;
  role: AdminRoleName | null;
} | null> {
  const explicit = req.headers.get("x-admin-user")?.trim();
  if (explicit) {
    const user = await prisma.adminUser
      .findUnique({ where: { email: explicit } })
      .catch(() => null);
    if (user && user.active) {
      return { email: user.email, role: user.role as AdminRoleName };
    }
  }

  // Basic Auth 폴백 — 단일 admin이면 SUPER로 간주
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
      const username = decoded.split(":")[0];
      if (username) {
        const user = await prisma.adminUser
          .findUnique({ where: { email: username } })
          .catch(() => null);
        if (user && user.active) {
          return { email: user.email, role: user.role as AdminRoleName };
        }
        // 단일사무소 fallback
        return { email: username, role: "SUPER" };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export interface RoleGuardOk {
  ok: true;
  user: { email: string; role: AdminRoleName };
}

export interface RoleGuardFail {
  ok: false;
  response: NextResponse;
}

export async function requireRole(
  req: Request,
  allowed: AdminRoleName[]
): Promise<RoleGuardOk | RoleGuardFail> {
  const actor = await resolveActor(req);
  if (!actor || !actor.role) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  if (!hasAnyRole(actor.role, allowed)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Forbidden", role: actor.role, requiredAny: allowed },
        { status: 403 }
      ),
    };
  }
  return { ok: true, user: { email: actor.email, role: actor.role } };
}

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------

export interface AuditLogInput {
  actorEmail: string;
  actorRole?: AdminRoleName;
  action: AdminAuditActionName;
  resource: string;
  resourceId?: string;
  details?: unknown;
  ip?: string;
  userAgent?: string;
  orgId?: string;
}

const ALERT_ACTIONS = new Set([
  "PAYMENT_CANCEL",
  "ROLE_CHANGE",
  "DELETE",
  "CONFIG_CHANGE",
]);

async function alertSupersIfNeeded(input: AuditLogInput): Promise<void> {
  if (!ALERT_ACTIONS.has(input.action)) return;
  try {
    // 동적 import — 순환 의존 방지
    const { sendKakaoAlimtalk } = await import(
      "@/lib/services/kakao-notification-service"
    );
    const supers = await prisma.adminUser.findMany({
      where: { role: "SUPER", active: true },
      select: { email: true, name: true },
    });
    // SUPER 본인이 액션 수행한 경우 자기 자신 제외
    const targets = supers.filter((s) => s.email !== input.actorEmail);
    if (targets.length === 0) return;

    const summary = `${input.action} on ${input.resource}${input.resourceId ? `(${input.resourceId.slice(0, 8)})` : ""} by ${input.actorEmail}`;
    for (const s of targets) {
      // 메모 채널 — SUPER가 등록한 phone이 있을 때만 (현재 AdminUser에 phone 미존재 → email로 fallback)
      // 실제 발송은 SOLAPI 미설정 시 자동 SKIPPED → audit 영속
      await sendKakaoAlimtalk(
        {
          to: s.email, // phone 컬럼 도입 시 교체
          templateId: "admin_audit_alert",
          variables: { 액션: input.action, 요약: summary },
          disableSmsFallback: true,
        },
        `[ETHOS Audit] ${summary}`
      );
    }
  } catch (err) {
    logger.warn("[admin-rbac] alert dispatch failed", err);
  }
}

export async function logAdminAudit(input: AuditLogInput): Promise<void> {
  try {
    await prisma.adminAuditEvent.create({
      data: {
        orgId: input.orgId,
        actorEmail: input.actorEmail,
        actorRole: input.actorRole,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        details:
          input.details !== undefined
            ? JSON.stringify(input.details).slice(0, 4000)
            : null,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  } catch (err) {
    logger.error("[admin-rbac] audit log failed", err);
  }
  // best-effort 외부 알림
  void alertSupersIfNeeded(input);
}

export function ipFromRequest(req: Request): string | undefined {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined
  );
}

// ---------------------------------------------------------------------------
// User management helpers (admin UI에서 호출)
// ---------------------------------------------------------------------------

export async function listAdminUsers(orgId?: string) {
  try {
    return await prisma.adminUser.findMany({
      where: orgId ? { orgId } : {},
      orderBy: [{ active: "desc" }, { role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getAdminUserStats() {
  try {
    const rows = await prisma.adminUser.groupBy({
      by: ["role"],
      _count: true,
      where: { active: true },
    });
    return Object.fromEntries(rows.map((r) => [r.role, r._count]));
  } catch {
    return {};
  }
}
