import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { createCaseFollowUpAction } from "@/lib/services/client-relationship-service";
import { createFollowUpActionSchema } from "@/lib/validation/case";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await requireAdminApiSession("ADMIN");
    const payload = createFollowUpActionSchema.parse(await request.json());
    const caseWorkspace = await createCaseFollowUpAction(id, {
      type: payload.type,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      note: payload.note,
      title: payload.title
    });
    const latest = caseWorkspace.followUpActions[0];
    await createAuditLog(prisma, {
      actor: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      actionType: "FOLLOW_UP_CREATED",
      entityType: "FOLLOW_UP",
      entityId: latest?.id ?? id,
      summary: `후속조치 생성: ${payload.type}`
    });

    return NextResponse.json({ caseWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to create follow-up action.");
  }
}
