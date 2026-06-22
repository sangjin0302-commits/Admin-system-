import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  requireRole,
  logAdminAudit,
  ipFromRequest,
  type AdminRoleName,
} from "@/lib/services/admin-rbac-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLE_VALUES: [AdminRoleName, ...AdminRoleName[]] = [
  "SUPER",
  "MANAGER",
  "STAFF",
  "EXTERNAL",
  "AUDITOR",
];

const patchSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.enum(ROLE_VALUES).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.users.patch");
  const guard = await requireRole(req, ["SUPER"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;

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
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  try {
    const user = await prisma.adminUser.update({ where: { id }, data });

    await logAdminAudit({
      actorEmail: guard.user.email,
      actorRole: guard.user.role,
      action: parsed.data.role ? "ROLE_CHANGE" : "UPDATE",
      resource: "AdminUser",
      resourceId: user.id,
      details: {
        changedFields: Object.keys(data),
        newRole: parsed.data.role,
        newActive: parsed.data.active,
      },
      ip: ipFromRequest(req),
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
      },
    });
  } catch {
    return api.error(404, "사용자를 찾지 못했습니다.", { code: "USER_NOT_FOUND" });
  }
}
