/**
 * LLL6: 마케팅 지침 문서 관리 API.
 *
 * GET  → { current, versions }
 * POST → { content, version } — 저장 + 스냅샷
 *
 * Feature flag: `marketing_guideline_doc`.
 */

import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getGuidelineDoc,
  listVersions,
  saveGuidelineDoc,
} from "@/lib/services/marketing-guideline-doc-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const api = createAdminRequestContext("admin.marketing-guideline.get");
  if (!(await isFeatureEnabled("marketing_guideline_doc"))) {
    return api.error(403, "마케팅 지침 문서 관리 비활성", { code: "FEATURE_DISABLED" });
  }
  try {
    const [current, versions] = await Promise.all([getGuidelineDoc(), listVersions()]);
    return api.ok({ current, versions });
  } catch (err) {
    api.logError(err);
    return api.error(500, "지침 문서 조회 실패", { code: "GUIDELINE_DOC_FETCH_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.marketing-guideline.save");
  if (!(await isFeatureEnabled("marketing_guideline_doc"))) {
    return api.error(403, "마케팅 지침 문서 관리 비활성", { code: "FEATURE_DISABLED" });
  }
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 JSON", { code: "INVALID_JSON" });
  const body = parsed.body as { content?: unknown; version?: unknown; updatedBy?: unknown };
  const content = typeof body.content === "string" ? body.content : "";
  const version = typeof body.version === "string" ? body.version : "";
  const updatedBy = typeof body.updatedBy === "string" ? body.updatedBy : undefined;
  if (!content.trim()) return api.error(400, "content 필수", { code: "INVALID_INPUT" });
  if (!version.trim()) return api.error(400, "version 필수", { code: "INVALID_INPUT" });
  if (content.length > 50_000) return api.error(400, "content 5만자 초과", { code: "TOO_LONG" });

  try {
    const doc = await saveGuidelineDoc(content, version, updatedBy);
    const versions = await listVersions();
    return api.ok({ current: doc, versions });
  } catch (err) {
    api.logError(err);
    return api.error(500, "지침 문서 저장 실패", { code: "GUIDELINE_DOC_SAVE_FAILED" });
  }
}
