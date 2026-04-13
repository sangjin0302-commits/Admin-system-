import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createSupplementRequest } from "@/lib/services/submission-service";
import { createSupplementRequestSchema } from "@/lib/validation/submission";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const payload = createSupplementRequestSchema.parse(await request.json());
    const submissionWorkspace = await createSupplementRequest(id, {
      submissionPackageId: payload.submissionPackageId,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      requestedBy: payload.requestedBy,
      summary: payload.summary,
      note: payload.note,
      relatedDocumentItemIds: payload.relatedDocumentItemIds
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
      { error: error instanceof Error ? error.message : "Failed to create supplement request." },
      { status: 400 }
    );
  }
}
