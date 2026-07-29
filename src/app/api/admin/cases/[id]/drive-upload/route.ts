/**
 * 사건 → 구글 Drive 파일 첨부.
 *
 * multipart/form-data 로 파일을 받아 사건 Drive 폴더에 업로드한다.
 * 구글 미연결 시 not_connected.
 *
 *   POST /api/admin/cases/{id}/drive-upload  (FormData: file)
 *   → { ok, webViewLink, name }
 */

import { createAdminRequestContext } from "@/lib/http/admin-api";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { getCaseMatterById } from "@/lib/services/case-matter-service";
import { getOrCreateCaseFolder, uploadFile } from "@/lib/services/google-drive-service";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

async function readCaseFolder(
  caseId: string
): Promise<{ folderId: string; webViewLink?: string } | null> {
  const row = await prisma.siteSetting
    .findUnique({ where: { key: `case.drivefolder.${caseId}` } })
    .catch(() => null);
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as { folderId?: string; webViewLink?: string };
    return parsed.folderId ? { folderId: parsed.folderId, webViewLink: parsed.webViewLink } : null;
  } catch {
    return null;
  }
}

async function recordCaseFolder(
  caseId: string,
  folder: { folderId: string; webViewLink?: string }
) {
  const value = JSON.stringify({
    folderId: folder.folderId,
    webViewLink: folder.webViewLink ?? null,
    createdAt: new Date().toISOString()
  });
  await prisma.siteSetting.upsert({
    where: { key: `case.drivefolder.${caseId}` },
    create: { key: `case.drivefolder.${caseId}`, value },
    update: { value }
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.cases.drive-upload.post");
  const { id: rawCaseId } = await context.params;
  const caseId = normalizeAdminEntityId(rawCaseId);
  if (!caseId) return api.error(400, "Invalid case id.", { code: "INVALID_CASE_ID" });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return api.error(400, "multipart/form-data 형식이 아닙니다.", { code: "INVALID_FORM" });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return api.error(400, "file 필드가 필요합니다.", { code: "FILE_REQUIRED" });
  }
  if (file.size > MAX_BYTES) {
    return api.error(413, "파일이 너무 큽니다(최대 20MB).", { code: "FILE_TOO_LARGE" });
  }

  try {
    const cm = await getCaseMatterById(caseId);
    if (!cm) return api.error(404, "사건을 찾을 수 없습니다.", { code: "CASE_NOT_FOUND" });

    const label = `${cm.caseNo ?? cm.id} ${cm.title}`.trim().slice(0, 120);
    let folder = await readCaseFolder(caseId);
    if (!folder) {
      folder = await getOrCreateCaseFolder(label);
      if (folder?.folderId) await recordCaseFolder(caseId, folder);
    }
    if (!folder?.folderId) {
      return api.error(409, "구글 미연결 또는 폴더 생성 실패. 구글 연결을 확인하세요.", {
        code: "NOT_CONNECTED_OR_FAILED"
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile({
      name: file.name || `upload-${Date.now()}`,
      mimeType: file.type || "application/octet-stream",
      data: buffer,
      folderId: folder.folderId
    });
    if (!uploaded) {
      return api.error(409, "업로드 실패. 구글 연결을 확인하세요.", {
        code: "UPLOAD_FAILED"
      });
    }

    return api.ok({ ok: true, webViewLink: uploaded.webViewLink ?? null, name: file.name });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Drive 업로드에 실패했습니다.", { code: "DRIVE_UPLOAD_FAILED" });
  }
}
