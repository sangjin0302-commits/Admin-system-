import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
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
    await requireAdminApiSession("ADMIN");
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

    return authErrorResponse(error, "Failed to update case document file.");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; documentId: string; fileId: string }> }
) {
  const { id, documentId, fileId } = await context.params;

  try {
    await requireAdminApiSession("ADMIN");
    const caseWorkspace = await deleteCaseDocumentFile(id, documentId, fileId);
    return NextResponse.json({ caseWorkspace });
  } catch (error) {
    return authErrorResponse(error, "Failed to delete case document file.");
  }
}
