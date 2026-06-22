import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  requireRole,
  logAdminAudit,
  ipFromRequest,
} from "@/lib/services/admin-rbac-service";
import {
  generateSecret,
  getOtpauthUrl,
  verifyTotp,
} from "@/lib/services/totp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET — 새 시크릿 생성 (저장 X) + otpauth URI 반환.
 *       사용자가 인증앱에서 등록 후 POST verify로 활성화.
 */
export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.2fa.enroll.start");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const secret = generateSecret();
  const uri = getOtpauthUrl(secret, guard.user.email, "ETHOS");
  return NextResponse.json({
    ok: true,
    secret,
    otpauthUri: uri,
    digits: 6,
    period: 30,
    instructions:
      "1) 인증앱(Google Authenticator/1Password/Authy)에서 otpauthUri로 등록 " +
      "2) 6자리 코드를 POST /api/admin/2fa/enroll 로 confirm 하면 활성화됩니다.",
  });
}

const confirmSchema = z.object({
  secret: z.string().min(16).max(64),
  code: z.string().regex(/^\d{6}$/),
});

/**
 * POST — secret + 6자리 코드 검증 → AdminUser.totpSecret 저장 (활성화).
 */
export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.2fa.enroll.confirm");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return api.error(400, "invalid json", { code: "INVALID_JSON" });
  }
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return api.error(400, parsed.error.issues[0]?.message ?? "invalid body", {
      code: "INVALID_BODY",
    });
  }

  if (!verifyTotp(parsed.data.secret, parsed.data.code)) {
    return api.error(401, "코드가 일치하지 않습니다.", { code: "TOTP_INVALID" });
  }

  await prisma.adminUser.update({
    where: { email: guard.user.email },
    data: { totpSecret: parsed.data.secret },
  });

  await logAdminAudit({
    actorEmail: guard.user.email,
    actorRole: guard.user.role,
    action: "CONFIG_CHANGE",
    resource: "AdminUser.2fa",
    resourceId: guard.user.email,
    details: { enrolled: true },
    ip: ipFromRequest(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ ok: true, message: "2FA 활성화됨" });
}

/**
 * DELETE — 2FA 비활성화 (본인 또는 SUPER가 타인).
 */
export async function DELETE(req: Request) {
  const api = createAdminRequestContext("admin.2fa.disable");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const targetEmail = url.searchParams.get("email")?.trim() || guard.user.email;

  if (targetEmail !== guard.user.email && guard.user.role !== "SUPER") {
    return api.error(403, "타인의 2FA 비활성화는 SUPER만 가능합니다.", {
      code: "FORBIDDEN_DISABLE_OTHER",
    });
  }

  await prisma.adminUser.update({
    where: { email: targetEmail },
    data: { totpSecret: null },
  });

  await logAdminAudit({
    actorEmail: guard.user.email,
    actorRole: guard.user.role,
    action: "CONFIG_CHANGE",
    resource: "AdminUser.2fa",
    resourceId: targetEmail,
    details: { enrolled: false, disabledByAdmin: targetEmail !== guard.user.email },
    ip: ipFromRequest(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ ok: true, message: "2FA 비활성화됨" });
}
