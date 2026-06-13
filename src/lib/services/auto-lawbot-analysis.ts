/**
 * intake 제출 직후 lawbot 자동 분석.
 * - lawbot 환경 변수 없으면 조용히 skip
 * - 실패해도 intake 흐름은 막지 않음 (best-effort)
 * - 결과는 Inquiry.lawbotSnapshot* 필드에 저장
 */

import { createLawbotBridgeHttpClientFromEnv } from "@/lib/services/lawbot-bridge-http-client";
import { prisma } from "@/lib/prisma/client";
import { intakeCategoryToCaseMatterCategory } from "@/types/intake-category";

type RunInput = {
  inquiryId: string;
  factInput: string;
  intakeCategoryKey?: string | null;
};

export async function autoAnalyzeInquiryWithLawbot(input: RunInput): Promise<void> {
  const hasLawbot =
    !!process.env.LAWBOT_BRIDGE_BASE_URL &&
    !!process.env.LAWBOT_SERVICE_KEY &&
    !!process.env.LAWBOT_SERVICE_CALLER;

  if (!hasLawbot) {
    console.log("[auto-lawbot] skipped — bridge env not set");
    return;
  }

  try {
    const client = createLawbotBridgeHttpClientFromEnv();
    const requestId = `auto-${input.inquiryId}-${Date.now()}`;
    const response = await client.intakeAnalyze({
      requestId,
      factInput: input.factInput
    });

    // 카테고리 자동 매핑 (intake category 우선, 없으면 lawbot 분야 추정)
    const inferredCategory =
      (input.intakeCategoryKey &&
        intakeCategoryToCaseMatterCategory[input.intakeCategoryKey as keyof typeof intakeCategoryToCaseMatterCategory]) ||
      inferCategoryFromLawbot(response);

    await prisma.inquiry.update({
      where: { id: input.inquiryId },
      data: {
        lawbotLastAnalyzedAt: new Date(),
        lawbotSnapshotStatus: response.review_required === false ? "READY" : "NEEDS_REVIEW",
        lawbotSnapshotSummary:
          typeof response.intake_summary === "object" && response.intake_summary
            ? JSON.stringify(response.intake_summary).slice(0, 1000)
            : null,
        lawbotSnapshotPayload: JSON.stringify(response).slice(0, 10_000),
        bridgeReviewRequired: Boolean(response.review_required ?? true),
        bridgeMustVerify: JSON.stringify(response.must_verify ?? []),
        bridgeRiskFlags: JSON.stringify(response.risk_flags ?? []),
        bridgeCaseOutlook: response.case_outlook
          ? JSON.stringify(response.case_outlook).slice(0, 2000)
          : null,
        // intake category 가 OTHER이거나 비어있으면 lawbot 추정값으로 보강
        ...(inferredCategory ? { /* 추후 case 전환 시 활용 (Inquiry 모델엔 category 필드 없음) */ } : {})
      }
    });

    console.log("[auto-lawbot] saved analysis for inquiry", input.inquiryId);
  } catch (error) {
    console.warn("[auto-lawbot] best-effort failed", error);
  }
}

function inferCategoryFromLawbot(response: { domain?: unknown }): string | null {
  if (!response.domain || typeof response.domain !== "object") return null;
  const domain = response.domain as Record<string, unknown>;
  const key = String(domain.primary_key ?? domain.area ?? "").toLowerCase();
  if (key.includes("visa") || key.includes("immigration") || key.includes("foreign")) return "VISA_STAY";
  if (key.includes("appeal") || key.includes("심판")) return "ADMIN_APPEAL";
  if (key.includes("contract") || key.includes("계약")) return "CONTRACT_INVESTIGATION";
  if (key.includes("permit") || key.includes("license") || key.includes("허가")) return "LICENSE_PERMIT";
  return null;
}
