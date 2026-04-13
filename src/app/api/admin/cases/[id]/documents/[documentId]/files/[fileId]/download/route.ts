import { NextResponse } from "next/server";

import { readCaseDocumentFile } from "@/lib/services/case-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; documentId: string; fileId: string }> }
) {
  const { id, documentId, fileId } = await context.params;

  try {
    const file = await readCaseDocumentFile(id, documentId, fileId);
    const encodedFilename = encodeURIComponent(file.originalFilename);

    return new NextResponse(new Uint8Array(file.fileBuffer), {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Length": String(file.fileBuffer.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read case document file." },
      { status: 404 }
    );
  }
}
