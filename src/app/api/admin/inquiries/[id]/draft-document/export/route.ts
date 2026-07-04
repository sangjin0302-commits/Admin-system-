import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { exportDraftToDocx } from "@/lib/services/document-docx-export";

export const maxDuration = 30;

const DOC_TYPE_TO_FILENAME: Record<string, string> = {
  opinion: "의견서",
  appeal: "행정심판청구서",
  objection: "이의신청서",
  petition: "청원서"
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.draft_document.export");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) {
    return api.error(400, "문의 ID 형식이 올바르지 않습니다.", { code: "INVALID_INQUIRY_ID" });
  }

  const bodyResult = await safeReadJsonBody(request);
  if (!bodyResult.ok) {
    return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  }
  const body = (bodyResult.body ?? {}) as {
    draftText?: string;
    documentType?: string;
    title?: string;
  };
  const draftText = typeof body.draftText === "string" ? body.draftText.trim() : "";
  const documentType =
    typeof body.documentType === "string" ? body.documentType.trim() : "opinion";
  if (draftText.length < 10) {
    return api.error(400, "내보낼 초안 텍스트가 부족합니다.", { code: "DRAFT_TEXT_TOO_SHORT" });
  }

  try {
    const buffer = await exportDraftToDocx({
      draftText,
      documentType,
      title: body.title
    });
    const filenameBase = DOC_TYPE_TO_FILENAME[documentType] ?? "draft";
    const filename = `${filenameBase}-${id}.docx`;
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "docx 내보내기 실패", { code: "DOCX_EXPORT_FAILED" });
  }
}
