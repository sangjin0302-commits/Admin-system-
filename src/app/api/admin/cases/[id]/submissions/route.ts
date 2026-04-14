import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { createSubmissionPackage } from "@/lib/services/submission-service";
import { createSubmissionPackageSchema } from "@/lib/validation/submission";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await requireAdminApiSession("ADMIN");
    const payload = createSubmissionPackageSchema.parse(await request.json());
    const submissionWorkspace = await createSubmissionPackage(id, {
      packageLabel: payload.packageLabel,
      submittedTo: payload.submittedTo,
      note: payload.note,
      status: payload.status,
      selectedDocumentItemIds: payload.selectedDocumentItemIds
    });
    const latest = submissionWorkspace.submissionPackages[0];
    await createAuditLog(prisma, {
      actor: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      actionType: "SUBMISSION_STATUS_UPDATED",
      entityType: "SUBMISSION",
      entityId: latest?.id ?? id,
      summary: `제출 패키지 ${payload.status ?? "DRAFT"} 생성`
    });

    return NextResponse.json({ submissionWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to create submission package.");
  }
}
