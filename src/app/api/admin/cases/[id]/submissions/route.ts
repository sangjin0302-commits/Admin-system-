import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createSubmissionPackage } from "@/lib/services/submission-service";
import { createSubmissionPackageSchema } from "@/lib/validation/submission";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const payload = createSubmissionPackageSchema.parse(await request.json());
    const submissionWorkspace = await createSubmissionPackage(id, {
      packageLabel: payload.packageLabel,
      submittedTo: payload.submittedTo,
      note: payload.note,
      status: payload.status,
      selectedDocumentItemIds: payload.selectedDocumentItemIds
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
      { error: error instanceof Error ? error.message : "Failed to create submission package." },
      { status: 400 }
    );
  }
}
