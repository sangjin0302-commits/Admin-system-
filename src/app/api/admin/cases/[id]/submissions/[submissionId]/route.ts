import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { updateSubmissionPackage } from "@/lib/services/submission-service";
import { updateSubmissionPackageSchema } from "@/lib/validation/submission";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; submissionId: string }> }
) {
  const { id, submissionId } = await context.params;

  try {
    const session = await requireAdminApiSession("ADMIN");
    const payload = updateSubmissionPackageSchema.parse(await request.json());
    const submissionWorkspace = await updateSubmissionPackage(id, submissionId, {
      status: payload.status,
      packageLabel: payload.packageLabel,
      submittedTo: payload.submittedTo,
      submittedAt:
        payload.submittedAt !== undefined
          ? payload.submittedAt
            ? new Date(payload.submittedAt)
            : null
          : undefined,
      note: payload.note
    });
    await createAuditLog(prisma, {
      actor: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      actionType: "SUBMISSION_STATUS_UPDATED",
      entityType: "SUBMISSION",
      entityId: submissionId,
      summary: `제출 패키지 상태를 ${payload.status ?? "updated"}로 변경`
    });

    return NextResponse.json({ submissionWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to update submission package.");
  }
}
