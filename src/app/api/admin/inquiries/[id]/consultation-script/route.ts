import { NextResponse } from "next/server";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { generateConsultationScript } from "@/lib/services/consultation-script-generator";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.consultation_script.post");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);

  if (!id) {
    return api.error(400, "문의 ID 형식이 올바르지 않습니다.", { code: "INVALID_INQUIRY_ID" });
  }

  try {
    const script = await generateConsultationScript(id);
    return NextResponse.json({ ok: true, script });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Inquiry not found")) {
      return api.error(404, "문의를 찾을 수 없습니다.", { code: "INQUIRY_NOT_FOUND" });
    }
    api.logError(error);
    return api.error(500, "상담 대본 생성에 실패했습니다.", { code: "SCRIPT_GENERATE_FAILED" });
  }
}
