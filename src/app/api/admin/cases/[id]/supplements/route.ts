import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { createSupplementRequest } from "@/lib/services/submission-service";
import { createSupplementRequestSchema } from "@/lib/validation/submission";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await requireAdminApiSession("ADMIN");
    const payload = createSupplementRequestSchema.parse(await request.json());
    const submissionWorkspace = await createSupplementRequest(id, {
      submissionPackageId: payload.submissionPackageId,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      requestedBy: payload.requestedBy,
      summary: payload.summary,
      note: payload.note,
      relatedDocumentItemIds: payload.relatedDocumentItemIds
    });
    const latest = submissionWorkspace.supplementRequests[0];
    await createAuditLog(prisma, {
      actor: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      actionType: "SUPPLEMENT_STATUS_UPDATED",
      entityType: "SUPPLEMENT",
      entityId: latest?.id ?? id,
      summary: `보완 요청 생성: ${payload.summary}`
    });

    return NextResponse.json({ submissionWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to create supplement request.");
  }
}
