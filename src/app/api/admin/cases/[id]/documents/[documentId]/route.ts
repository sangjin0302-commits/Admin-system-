import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { updateCaseDocumentItem } from "@/lib/services/case-service";
import { updateCaseDocumentSchema } from "@/lib/validation/case";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await context.params;

  try {
    await requireAdminApiSession("ADMIN");
    const payload = updateCaseDocumentSchema.parse(await request.json());
    const caseWorkspace = await updateCaseDocumentItem(id, documentId, payload);
    return NextResponse.json({ caseWorkspace });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to update document item.");
  }
}
