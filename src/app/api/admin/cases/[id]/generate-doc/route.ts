import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { generatePowerOfAttorney, generateReceipt } from "@/lib/services/case-document-generator";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

type DocType = "power_of_attorney" | "receipt";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.cases.generate-doc.post");
  const { id: rawCaseId } = await context.params;
  const caseId = normalizeAdminEntityId(rawCaseId);
  if (!caseId) return api.error(400, "Invalid case id.", { code: "INVALID_CASE_ID" });

  if (!(await isFeatureEnabled("case_doc_gen"))) {
    return api.error(403, "문서 생성 기능이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }

  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) return api.error(400, "요청 본문이 올바르지 않습니다.", { code: "INVALID_BODY" });

  const body = parsed.body as { type?: DocType; amount?: number; receivedAt?: string };
  const type = body.type;
  if (type !== "power_of_attorney" && type !== "receipt") {
    return api.error(400, "type은 power_of_attorney 또는 receipt이어야 합니다.", { code: "INVALID_TYPE" });
  }

  try {
    let html: string;
    if (type === "power_of_attorney") {
      html = await generatePowerOfAttorney(caseId);
    } else {
      const amount = typeof body.amount === "number" && Number.isFinite(body.amount) ? body.amount : 0;
      const receivedAt = body.receivedAt ? new Date(body.receivedAt) : new Date();
      html = await generateReceipt(caseId, amount, isNaN(receivedAt.getTime()) ? new Date() : receivedAt);
    }
    return api.text(html, { status: 200 }, "text/html; charset=utf-8");
  } catch (error) {
    api.logError(error);
    return api.error(500, "문서 생성에 실패했습니다.", { code: "DOC_GEN_FAILED" });
  }
}
