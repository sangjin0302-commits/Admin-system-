import { NextResponse } from "next/server";

import { createAuditLog } from "@/lib/audit/service";
import { clearAdminSession, getOptionalAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function POST() {
  const session = await getOptionalAdminSession();

  if (session) {
    await createAuditLog(prisma, {
      actor: { userId: session.user.id, email: session.user.email, role: session.user.role },
      actionType: "LOGOUT",
      entityType: "AUTH",
      entityId: session.user.id,
      summary: `${session.user.email} 로그아웃`
    }).catch(() => undefined);
  }

  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
