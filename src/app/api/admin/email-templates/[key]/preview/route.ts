/**
 * JJJ2: 이메일 템플릿 미리보기 API.
 *
 * POST /api/admin/email-templates/{key}/preview  { variables?, subject?, bodyHtml? }
 *   → { subject, html }
 *
 * 저장 없이 편집 중인 subject/bodyHtml 을 넘겨받아 렌더링 결과를 반환.
 * Feature flag: `email_template_manager`.
 */

import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { DEFAULT_TEMPLATES } from "@/lib/services/email-template-service";
import { renderTemplatePreview, SAMPLE_VARIABLES } from "@/lib/services/email-template-renderer";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function POST(request: Request, ctx: { params: Promise<{ key: string }> }) {
  const api = createAdminRequestContext("admin.email-templates.preview");
  if (!(await isFeatureEnabled("email_template_manager").catch(() => true))) {
    return api.error(403, "이메일 템플릿 관리가 비활성화되어 있습니다", {
      code: "FEATURE_DISABLED",
    });
  }
  const { key } = await ctx.params;
  const fallback = DEFAULT_TEMPLATES[key];
  if (!fallback) {
    return api.error(404, "알 수 없는 템플릿 키", { code: "UNKNOWN_KEY" });
  }
  const parsed = await safeReadJsonBody(request);
  const body = (parsed.ok ? parsed.body ?? {} : {}) as {
    variables?: Record<string, string>;
    subject?: string;
    bodyHtml?: string;
  };

  try {
    const vars: Record<string, string> = { ...SAMPLE_VARIABLES, ...(body.variables ?? {}) };

    // 편집 중인 subject/bodyHtml 이 제공되면 즉석 치환, 아니면 저장된 템플릿 사용.
    if (typeof body.subject === "string" || typeof body.bodyHtml === "string") {
      const subject = body.subject ?? fallback.subject;
      const bodyHtml = body.bodyHtml ?? fallback.bodyHtml;
      const replace = (s: string) =>
        s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, n) => vars[n] ?? `{{${n}}}`);
      return api.ok({ subject: replace(subject), html: replace(bodyHtml) });
    }

    const rendered = await renderTemplatePreview(key, body.variables ?? {});
    return api.ok(rendered);
  } catch (error) {
    api.logError(error);
    return api.error(500, "미리보기 생성 실패", { code: "TEMPLATE_PREVIEW_FAILED" });
  }
}
