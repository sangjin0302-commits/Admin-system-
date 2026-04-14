import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { updateSupplementRequest } from "@/lib/services/submission-service";
import { updateSupplementRequestSchema } from "@/lib/validation/submission";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; supplementId: string }> }
) {
  const { id, supplementId } = await context.params;

  try {
    const session = await requireAdminApiSession("ADMIN");
    const payload = updateSupplementRequestSchema.parse(await request.json());
    const submissionWorkspace = await updateSupplementRequest(id, supplementId, {
      status: payload.status,
      dueDate:
        payload.dueDate !== undefined
          ? payload.dueDate
            ? new Date(payload.dueDate)
            : null
          : undefined,
      summary: payload.summary,
      note: payload.note
    });
    await createAuditLog(prisma, {
      actor: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      actionType: "SUPPLEMENT_STATUS_UPDATED",
      entityType: "SUPPLEMENT",
      entityId: supplementId,
      summary: `보완 요청 상태를 ${payload.status ?? "updated"}로 변경`
    });

    return NextResponse.json({ submissionWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to update supplement request.");
  }
}
