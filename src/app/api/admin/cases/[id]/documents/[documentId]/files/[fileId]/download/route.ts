import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { readCaseDocumentFile } from "@/lib/services/case-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; documentId: string; fileId: string }> }
) {
  const { id, documentId, fileId } = await context.params;

  try {
    await requireAdminApiSession("ADMIN");
    const file = await readCaseDocumentFile(id, documentId, fileId);

    if (file.externalUrl) {
      return NextResponse.redirect(file.externalUrl);
    }

    const body = new Blob([file.fileBuffer ? Uint8Array.from(file.fileBuffer) : new Uint8Array()]);

    return new NextResponse(body, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`
      }
    });
  } catch (error) {
    return authErrorResponse(error, "Failed to download case document file.");
  }
}
