import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { updateSupplementRequest } from "@/lib/services/submission-service";
import { updateSupplementRequestSchema } from "@/lib/validation/submission";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; supplementId: string }> }
) {
  const { id, supplementId } = await context.params;

  try {
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

    return NextResponse.json({ submissionWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update supplement request." },
      { status: 400 }
    );
  }
}
