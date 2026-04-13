import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  deleteCaseDocumentFile,
  setCurrentCaseDocumentFile,
  updateCaseDocumentFileNote
} from "@/lib/services/case-service";
import { updateCaseDocumentFileSchema } from "@/lib/validation/case-file";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string; fileId: string }> }
) {
  const { id, documentId, fileId } = await context.params;

  try {
    const payload = updateCaseDocumentFileSchema.parse(await request.json());
    const caseWorkspace =
      payload.mode === "setCurrent"
        ? await setCurrentCaseDocumentFile(id, documentId, fileId)
        : await updateCaseDocumentFileNote(id, documentId, fileId, payload.note);

    return NextResponse.json({ caseWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update case document file." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; documentId: string; fileId: string }> }
) {
  const { id, documentId, fileId } = await context.params;

  try {
    const caseWorkspace = await deleteCaseDocumentFile(id, documentId, fileId);
    return NextResponse.json({ caseWorkspace });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete case document file." },
      { status: 400 }
    );
  }
}
