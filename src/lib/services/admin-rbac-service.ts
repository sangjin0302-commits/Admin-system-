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
  // Strict RBAC 플래그 — default true. false로 토글 시 예전(취약) 동작 복구.
  let strictRbac = true;
  try {
    const { isFeatureEnabled } = await import("@/lib/services/feature-flags-service");
    strictRbac = await isFeatureEnabled("admin_strict_rbac");
  } catch {
    // 플래그 조회 실패 시 안전한 기본값(strict) 유지
    strictRbac = true;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const allowUnknownSuper = process.env.ADMIN_ALLOW_UNKNOWN_SUPER === "true";

  const explicitRaw = req.headers.get("x-admin-user")?.trim();
  // X-Admin-User: strict + production 조합에서는 완전 무시 (헤더 스푸핑 차단)
  if (explicitRaw && strictRbac && isProduction) {
    logger.warn("[rbac] X-Admin-User header ignored in production", {
      attempted: explicitRaw,
    });
  }
  const explicit =
    explicitRaw && !(strictRbac && isProduction) ? explicitRaw : undefined;
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
        // 미등록 사용자 → 예전엔 무조건 SUPER 부여(백도어). 이제는 명시적 opt-in만 허용.
        if (!strictRbac || allowUnknownSuper) {
          if (strictRbac && allowUnknownSuper) {
            logger.warn(
              "[rbac] unknown Basic Auth user granted SUPER via ADMIN_ALLOW_UNKNOWN_SUPER",
              { username }
            );
          }
          return { email: username, role: "SUPER" };
        }
        logger.warn("[rbac] unknown Basic Auth user denied (strict RBAC)", {
          username,
        });
        return null;
      }
    } catch {
      // ignore
    }
  }

  // 관리자 세션 쿠키 폴백 — 세션 로그인 사용자 인식.
  // (미들웨어는 세션 쿠키를 인정하지만 RBAC 는 그동안 Basic Auth 만 봤다 → 세션 로그인 시
  //  모든 requireRole 라우트가 401. 이 분기가 그 갭을 메운다.)
  // 서명된 JWT 라 스푸핑 불가하며, 미등록 사용자는 env 기본 관리자와 일치할 때만 SUPER 로
  // 인정한다(사무소 소유자 1인). 임의 사용자에게 권한을 주지 않는다.
  try {
    const { cookies } = await import("next/headers");
    const { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } = await import(
      "@/lib/security/admin-session"
    );
    const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    const username = await verifyAdminSessionToken(token);
    if (username) {
      const user = await prisma.adminUser
        .findUnique({ where: { email: username } })
        .catch(() => null);
      if (user && user.active) {
        return { email: user.email, role: user.role as AdminRoleName };
      }
      const primaryAdmin = process.env.ADMIN_BASIC_AUTH_USER?.trim();
      if (primaryAdmin && username === primaryAdmin) {
        return { email: username, role: "SUPER" };
      }
      logger.warn("[rbac] valid session but user not registered and not primary admin", {
        username,
      });
    }
  } catch {
    // ignore
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
