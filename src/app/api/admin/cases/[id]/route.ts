import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { updateCaseStage } from "@/lib/services/case-service";
import { updateCaseStageSchema } from "@/lib/validation/case";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await requireAdminApiSession("ADMIN");
    const payload = updateCaseStageSchema.parse(await request.json());
    const parseDate = (value?: string) => {
      if (value === "") return null;
      if (!value) return undefined;
      return new Date(value);
    };

    const caseWorkspace = await updateCaseStage(id, {
      stage: payload.stage,
      dueDate: parseDate(payload.dueDate),
      filingDeadline: parseDate(payload.filingDeadline),
      supplementDeadline: parseDate(payload.supplementDeadline),
      stayExpirationDate: parseDate(payload.stayExpirationDate),
      internalDeadline: parseDate(payload.internalDeadline),
      internalMemo: payload.internalMemo,
      closedAt: parseDate(payload.closedAt),
      closeReason: payload.closeReason,
      outcomeSummary: payload.outcomeSummary,
      nextFollowUpDate: parseDate(payload.nextFollowUpDate),
      clientRelationshipStatus: payload.clientRelationshipStatus,
      reviewRequested: payload.reviewRequested,
      reviewCompleted: payload.reviewCompleted,
      referralEligible: payload.referralEligible,
      reengagementEligible: payload.reengagementEligible,
      lastFollowUpAt: parseDate(payload.lastFollowUpAt),
      logNote: payload.logNote
    });
    await createAuditLog(prisma, {
      actor: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      actionType: "CASE_STAGE_UPDATED",
      entityType: "CASE",
      entityId: caseWorkspace.id,
      summary: `사건 단계를 ${payload.stage}로 변경`
    });

    return NextResponse.json({ caseWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to update case.");
  }
}
