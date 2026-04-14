import { NextResponse } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authenticateAdminUser, createAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const user = await authenticateAdminUser(payload.email, payload.password);
    await createAdminSession(user.id);
    await createAuditLog(prisma, {
      actor: { userId: user.id, email: user.email, role: user.role },
      actionType: "LOGIN",
      entityType: "AUTH",
      entityId: user.id,
      summary: `${user.email} 로그인`
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "로그인에 실패했습니다." },
      { status: 401 }
    );
  }
}
