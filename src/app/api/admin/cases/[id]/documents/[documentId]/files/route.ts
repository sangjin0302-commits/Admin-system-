import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { uploadCaseDocumentFile } from "@/lib/services/case-service";
import { uploadCaseDocumentFileMetaSchema } from "@/lib/validation/case-file";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await context.params;

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const noteEntry = formData.get("note");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "업로드할 파일을 선택해 주세요." }, { status: 400 });
    }

    const payload = uploadCaseDocumentFileMetaSchema.parse({
      note: typeof noteEntry === "string" ? noteEntry : undefined
    });

    const caseWorkspace = await uploadCaseDocumentFile(id, documentId, {
      file: fileEntry,
      note: payload.note
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
      { error: error instanceof Error ? error.message : "Failed to upload case document file." },
      { status: 400 }
    );
  }
}
