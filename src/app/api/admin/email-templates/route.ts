import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { saveTemplate } from "@/lib/services/email-template-service";

export async function PUT(request: Request) {
  const api = createAdminRequestContext("admin.email-templates.save");
  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) {
    return api.error(400, "잘못된 요청 본문", { code: "INVALID_BODY" });
  }
  const { key, subject, bodyHtml } = (parsed.body ?? {}) as {
    key?: string;
    subject?: string;
    bodyHtml?: string;
  };
  if (!key || !subject || !bodyHtml) {
    return api.error(400, "key, subject, bodyHtml이 필요합니다", {
      code: "MISSING_FIELDS",
    });
  }
  try {
    await saveTemplate(key, subject, bodyHtml);
    return api.ok({ ok: true });
  } catch (error) {
    api.logError(error);
    return api.error(500, "템플릿 저장 실패", { code: "TEMPLATE_SAVE_FAILED" });
  }
}
