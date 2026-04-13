import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { updateCaseStage } from "@/lib/services/case-service";
import { updateCaseStageSchema } from "@/lib/validation/case";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const payload = updateCaseStageSchema.parse(await request.json());
    const caseWorkspace = await updateCaseStage(id, {
      stage: payload.stage,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      filingDeadline: payload.filingDeadline ? new Date(payload.filingDeadline) : undefined,
      supplementDeadline: payload.supplementDeadline ? new Date(payload.supplementDeadline) : undefined,
      stayExpirationDate: payload.stayExpirationDate ? new Date(payload.stayExpirationDate) : undefined,
      internalDeadline: payload.internalDeadline ? new Date(payload.internalDeadline) : undefined,
      internalMemo: payload.internalMemo,
      logNote: payload.logNote
    });

    return NextResponse.json({ caseWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update case." },
      { status: 400 }
    );
  }
}
