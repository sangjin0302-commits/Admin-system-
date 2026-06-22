import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  requireRole,
  logAdminAudit,
  ipFromRequest,
} from "@/lib/services/admin-rbac-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(200).optional(),
});

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.users.me.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF", "AUDITOR", "EXTERNAL"]);
  if (!guard.ok) return guard.response;

  const user = await prisma.adminUser
    .findUnique({
      where: { email: guard.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        totpSecret: true,
      },
    })
    .catch(() => null);

  if (!user) {
    return api.error(404, "사용자를 찾을 수 없습니다.", { code: "USER_NOT_FOUND" });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      twoFactorEnabled: !!user.totpSecret,
    },
  });
}

export async function PATCH(req: Request) {
  const api = createAdminRequestContext("admin.users.me.patch");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF", "AUDITOR", "EXTERNAL"]);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return api.error(400, "invalid json", { code: "INVALID_JSON" });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return api.error(400, parsed.error.issues[0]?.message ?? "invalid body", {
      code: "INVALID_BODY",
    });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;

  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) {
      return api.error(400, "현재 비밀번호가 필요합니다.", {
        code: "CURRENT_PASSWORD_REQUIRED",
      });
    }
    const user = await prisma.adminUser
      .findUnique({ where: { email: guard.user.email } })
      .catch(() => null);
    if (!user || !user.passwordHash) {
      return api.error(400, "비밀번호 변경 불가 (계정 미설정)", {
        code: "NO_EXISTING_PASSWORD",
      });
    }
    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) {
      return api.error(401, "현재 비밀번호가 일치하지 않습니다.", {
        code: "WRONG_CURRENT_PASSWORD",
      });
    }
    data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  }

  if (Object.keys(data).length === 0) {
    return api.error(400, "변경할 항목이 없습니다.", { code: "NO_CHANGES" });
  }

  const updated = await prisma.adminUser.update({
    where: { email: guard.user.email },
    data,
  });

  await logAdminAudit({
    actorEmail: guard.user.email,
    actorRole: guard.user.role,
    action: "UPDATE",
    resource: "AdminUser.me",
    resourceId: updated.id,
    details: { changedFields: Object.keys(data) },
    ip: ipFromRequest(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    user: { name: updated.name, email: updated.email },
  });
}
