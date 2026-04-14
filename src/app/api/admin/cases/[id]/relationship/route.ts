import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { updateClientRelationship } from "@/lib/services/client-relationship-service";
import { updateCaseStageSchema } from "@/lib/validation/case";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await requireAdminApiSession("ADMIN");
    const payload = updateCaseStageSchema.parse(await request.json());
    const parseDate = (value?: string) => {
      if (value === "") return null;
      if (!value) return undefined;
      return new Date(value);
    };

    const relationshipWorkspace = await updateClientRelationship(id, {
      closedAt: parseDate(payload.closedAt),
      closeReason: payload.closeReason,
      outcomeSummary: payload.outcomeSummary,
      nextFollowUpDate: parseDate(payload.nextFollowUpDate),
      clientRelationshipStatus: payload.clientRelationshipStatus,
      reviewRequested: payload.reviewRequested,
      reviewCompleted: payload.reviewCompleted,
      referralEligible: payload.referralEligible,
      reengagementEligible: payload.reengagementEligible,
      lastFollowUpAt: parseDate(payload.lastFollowUpAt)
    });

    return NextResponse.json({ relationshipWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to update relationship state.");
  }
}
