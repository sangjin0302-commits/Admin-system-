/**
 * LLL7: AI 초안 지침 검증 API.
 *
 * POST { text } → { violations, guidelineVersion }
 *
 * Feature flag: `ai_draft_guideline_check`.
 */

import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { scanContentWithCustomRules } from "@/lib/services/marketing-guideline-service";
import { getGuidelineDoc } from "@/lib/services/marketing-guideline-doc-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.ai-draft-check");
  if (!(await isFeatureEnabled("ai_draft_guideline_check"))) {
    return api.error(403, "AI 초안 검증 비활성", { code: "FEATURE_DISABLED" });
  }
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 JSON", { code: "INVALID_JSON" });
  const body = parsed.body as { text?: unknown };
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return api.error(400, "text 필수", { code: "INVALID_INPUT" });
  if (text.length > 20_000) return api.error(400, "text 2만자 초과", { code: "TOO_LONG" });

  try {
    const [violations, doc] = await Promise.all([
      scanContentWithCustomRules(text),
      getGuidelineDoc().catch(() => null),
    ]);
    return api.ok({
      violations,
      guidelineVersion: doc?.version ?? null,
      count: violations.length,
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "검증 실패", { code: "CHECK_FAILED" });
  }
}
