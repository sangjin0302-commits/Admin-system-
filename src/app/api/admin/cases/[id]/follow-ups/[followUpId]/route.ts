import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { updateCaseFollowUpAction } from "@/lib/services/client-relationship-service";
import { updateFollowUpActionSchema } from "@/lib/validation/case";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; followUpId: string }> }
) {
  const { id, followUpId } = await context.params;

  try {
    const session = await requireAdminApiSession("ADMIN");
    const payload = updateFollowUpActionSchema.parse(await request.json());
    const parseDate = (value?: string) => {
      if (value === "") return null;
      if (!value) return undefined;
      return new Date(value);
    };

    const caseWorkspace = await updateCaseFollowUpAction(id, followUpId, {
      status: payload.status,
      dueDate: parseDate(payload.dueDate),
      note: payload.note,
      title: payload.title
    });
    await createAuditLog(prisma, {
      actor: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      actionType: "FOLLOW_UP_UPDATED",
      entityType: "FOLLOW_UP",
      entityId: followUpId,
      summary: `후속조치 상태를 ${payload.status ?? "updated"}로 변경`
    });

    return NextResponse.json({ caseWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to update follow-up action.");
  }
}
