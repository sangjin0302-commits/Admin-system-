import { createAdminRequestContext } from "@/lib/http/admin-api";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { predictNextNeeds, buildProposalDraft } from "@/lib/services/needs-prediction-service";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.needs-prediction.get");
  if (!(await isFeatureEnabled("needs_prediction"))) {
    return api.error(403, "기능이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { id: rawId } = await context.params;
  const caseId = normalizeAdminEntityId(rawId);
  if (!caseId) return api.error(400, "잘못된 사건 ID", { code: "INVALID_CASE_ID" });
  try {
    const prediction = await predictNextNeeds(caseId);
    if (!prediction) return api.error(404, "사건을 찾을 수 없습니다.", { code: "CASE_NOT_FOUND" });
    return api.ok({ ok: true, prediction });
  } catch (err) {
    api.logError(err);
    return api.error(500, "예측 실패", { code: "PREDICTION_FAILED" });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.needs-prediction.draft");
  if (!(await isFeatureEnabled("needs_prediction"))) {
    return api.error(403, "기능이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { id: rawId } = await context.params;
  const caseId = normalizeAdminEntityId(rawId);
  if (!caseId) return api.error(400, "잘못된 사건 ID", { code: "INVALID_CASE_ID" });
  try {
    const cm = await prisma.caseMatter.findUnique({
      where: { id: caseId },
      select: { inquiry: { select: { contactName: true } } },
    });
    if (!cm) return api.error(404, "사건을 찾을 수 없습니다.", { code: "CASE_NOT_FOUND" });
    const prediction = await predictNextNeeds(caseId);
    if (!prediction) return api.error(500, "예측 결과 없음", { code: "NO_PREDICTION" });
    const name = cm.inquiry?.contactName ?? "고객";
    const draft = buildProposalDraft(name, prediction.suggestions);
    return api.ok({ ok: true, draft, prediction });
  } catch (err) {
    api.logError(err);
    return api.error(500, "제안 초안 실패", { code: "DRAFT_FAILED" });
  }
}
