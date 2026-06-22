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

const createSchema = z.object({
  email: z.string().email().max(120),
  name: z.string().min(1).max(50),
  role: z.enum(ROLE_VALUES).default("STAFF"),
  password: z.string().min(8).max(200).optional(),
});

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.users.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "AUDITOR"]);
  if (!guard.ok) return guard.response;

  try {
    const users = await prisma.adminUser.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
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
    return api.ok({ ok: true, users });
  } catch (err) {
    api.logError(err);
    return api.error(500, "사용자 목록 조회 실패", { code: "USERS_LIST_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.users.create");
  const guard = await requireRole(req, ["SUPER"]);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return api.error(400, "invalid json", { code: "INVALID_JSON" });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return api.error(400, parsed.error.issues[0]?.message ?? "invalid body", {
      code: "INVALID_BODY",
    });
  }

  const existing = await prisma.adminUser
    .findUnique({ where: { email: parsed.data.email } })
    .catch(() => null);
  if (existing) {
    return api.error(409, "이미 등록된 이메일입니다.", { code: "EMAIL_TAKEN" });
  }

  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 12)
    : null;

  const user = await prisma.adminUser.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash,
    },
  });

  await logAdminAudit({
    actorEmail: guard.user.email,
    actorRole: guard.user.role,
    action: "CREATE",
    resource: "AdminUser",
    resourceId: user.id,
    details: { email: user.email, role: user.role, hasPassword: !!passwordHash },
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
      createdAt: user.createdAt.toISOString(),
    },
  });
}
