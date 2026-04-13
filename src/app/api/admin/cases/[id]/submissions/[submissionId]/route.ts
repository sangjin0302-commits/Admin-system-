import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { updateSubmissionPackage } from "@/lib/services/submission-service";
import { updateSubmissionPackageSchema } from "@/lib/validation/submission";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; submissionId: string }> }
) {
  const { id, submissionId } = await context.params;

  try {
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

    return NextResponse.json({ submissionWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update submission package." },
      { status: 400 }
    );
  }
}
