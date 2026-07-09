/**
 * III3: 이메일 템플릿 단건 조회 / 저장 API.
 *
 * GET  /api/admin/email-templates/{key} → { template }
 * PUT  /api/admin/email-templates/{key} { subject, bodyHtml } → { ok: true }
 *
 * Feature flag: `email_template_manager`
 */

import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  DEFAULT_TEMPLATES,
  getTemplate,
  saveTemplate,
} from "@/lib/services/email-template-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const api = createAdminRequestContext("admin.email-templates.get");
  if (!(await isFeatureEnabled("email_template_manager").catch(() => true))) {
    return api.error(403, "이메일 템플릿 관리가 비활성화되어 있습니다", {
      code: "FEATURE_DISABLED",
    });
  }
  const { key } = await ctx.params;
  if (!DEFAULT_TEMPLATES[key]) {
    return api.error(404, "알 수 없는 템플릿 키", { code: "UNKNOWN_KEY" });
  }
  try {
    const template = await getTemplate(key);
    return api.ok({ template });
  } catch (error) {
    api.logError(error);
    return api.error(500, "템플릿 조회 실패", { code: "TEMPLATE_GET_FAILED" });
  }
}

export async function PUT(request: Request, ctx: { params: Promise<{ key: string }> }) {
  const api = createAdminRequestContext("admin.email-templates.save-by-key");
  if (!(await isFeatureEnabled("email_template_manager").catch(() => true))) {
    return api.error(403, "이메일 템플릿 관리가 비활성화되어 있습니다", {
      code: "FEATURE_DISABLED",
    });
  }
  const { key } = await ctx.params;
  if (!DEFAULT_TEMPLATES[key]) {
    return api.error(404, "알 수 없는 템플릿 키", { code: "UNKNOWN_KEY" });
  }
  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) {
    return api.error(400, "잘못된 요청 본문", { code: "INVALID_BODY" });
  }
  const { subject, bodyHtml } = (parsed.body ?? {}) as {
    subject?: string;
    bodyHtml?: string;
  };
  if (!subject || !bodyHtml) {
    return api.error(400, "subject, bodyHtml이 필요합니다", { code: "MISSING_FIELDS" });
  }
  try {
    await saveTemplate(key, subject, bodyHtml);
    return api.ok({ ok: true });
  } catch (error) {
    api.logError(error);
    return api.error(500, "템플릿 저장 실패", { code: "TEMPLATE_SAVE_FAILED" });
  }
}
