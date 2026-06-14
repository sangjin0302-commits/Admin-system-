import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { getFile } from "@/lib/storage/file-storage";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.uploaded-files.download");
  const { id } = await context.params;
  if (!id) return api.error(400, "Invalid file id.", { code: "INVALID_FILE_ID" });

  const record = await prisma.portalUploadedFile.findUnique({ where: { id } });
  if (!record) return api.error(404, "File not found.", { code: "NOT_FOUND" });

  try {
    const buffer = await getFile(record.storedPath);
    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": record.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(record.fileName)}"`
      }
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "파일을 읽지 못했습니다.", { code: "FILE_READ_FAILED" });
  }
}
