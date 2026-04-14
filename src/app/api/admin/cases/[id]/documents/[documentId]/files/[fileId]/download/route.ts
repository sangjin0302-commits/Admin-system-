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
    await requireAdminApiSession("STAFF");
    const file = await readCaseDocumentFile(id, documentId, fileId);
    const encodedFilename = encodeURIComponent(file.originalFilename);
    const fileBytes = Uint8Array.from(file.fileBuffer);
    const fileBlob = new Blob([fileBytes], {
      type: file.mimeType || "application/octet-stream"
    });

    return new NextResponse(fileBlob, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Length": String(file.fileBuffer.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return authErrorResponse(error, "Failed to read case document file.");
  }
}
