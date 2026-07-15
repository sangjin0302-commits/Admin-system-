import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { researchCase } from "@/lib/services/case-research-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.case-research");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("case_auto_research"))) {
    return api.error(403, "사건 자동 리서치 기능이 비활성화되어 있습니다.", {
      code: "FEATURE_DISABLED",
    });
  }

  const body = await safeReadJsonBody(req);
  if (!body.ok) {
    return api.error(400, "요청 본문(JSON)을 확인해 주세요.", {
      code: "INVALID_JSON_BODY",
    });
  }

  const { caseDescription, bypassCache } = (body.body ?? {}) as {
    caseDescription?: string;
    bypassCache?: boolean;
  };

  const desc = String(caseDescription ?? "").trim();
  if (desc.length < 20) {
    return api.error(400, "사건 설명은 20자 이상이어야 합니다.", {
      code: "DESCRIPTION_TOO_SHORT",
    });
  }
  if (desc.length > 5000) {
    return api.error(400, "사건 설명은 5000자 이하여야 합니다.", {
      code: "DESCRIPTION_TOO_LONG",
    });
  }

  try {
    const result = await researchCase(desc, { bypassCache: Boolean(bypassCache) });
    return api.ok({ ok: true, result });
  } catch (err) {
    api.logError(err);
    return api.error(500, "사건 자동 리서치에 실패했습니다.", {
      code: "CASE_RESEARCH_FAILED",
    });
  }
}
