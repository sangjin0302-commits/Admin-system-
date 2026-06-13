import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.admin-appeal-detail.patch");
  const { id: rawCaseMatterId } = await context.params;
  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);

  if (!caseMatterId) {
    return api.error(400, "Invalid case matter id format.", { code: "INVALID_CASE_MATTER_ID" });
  }

  const bodyResult = await safeReadJsonBody(request);
  if (!bodyResult.ok) {
    return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
  }

  try {
    const body = bodyResult.body as Record<string, unknown>;

    const data = {
      appealType: typeof body.appealType === "string" ? body.appealType : undefined,
      disposingAgency: typeof body.disposingAgency === "string" ? body.disposingAgency || null : undefined,
      reviewingAgency: typeof body.reviewingAgency === "string" ? body.reviewingAgency || null : undefined,
      dispositionContent: typeof body.dispositionContent === "string" ? body.dispositionContent || null : undefined,
      dispositionDate: typeof body.dispositionDate === "string" ? (body.dispositionDate ? new Date(body.dispositionDate) : null) : undefined,
      noticeReceivedDate: typeof body.noticeReceivedDate === "string" ? (body.noticeReceivedDate ? new Date(body.noticeReceivedDate) : null) : undefined,
      filingDeadline: typeof body.filingDeadline === "string" ? (body.filingDeadline ? new Date(body.filingDeadline) : null) : undefined,
      filedAt: typeof body.filedAt === "string" ? (body.filedAt ? new Date(body.filedAt) : null) : undefined,
      hearingDate: typeof body.hearingDate === "string" ? (body.hearingDate ? new Date(body.hearingDate) : null) : undefined,
      decisionExpectedDate: typeof body.decisionExpectedDate === "string" ? (body.decisionExpectedDate ? new Date(body.decisionExpectedDate) : null) : undefined,
      decisionReceivedDate: typeof body.decisionReceivedDate === "string" ? (body.decisionReceivedDate ? new Date(body.decisionReceivedDate) : null) : undefined,
      result: typeof body.result === "string" ? body.result : undefined,
      resultSummary: typeof body.resultSummary === "string" ? body.resultSummary || null : undefined,
      groundsSummary: typeof body.groundsSummary === "string" ? body.groundsSummary || null : undefined,
      evidenceSummary: typeof body.evidenceSummary === "string" ? body.evidenceSummary || null : undefined,
      caseNoOfficial: typeof body.caseNoOfficial === "string" ? body.caseNoOfficial || null : undefined,
      verifiedBy: typeof body.verifiedBy === "string" ? body.verifiedBy || null : undefined,
    };

    await prisma.adminAppealDetail.upsert({
      where: { caseId: caseMatterId },
      create: { caseId: caseMatterId, ...data } as never,
      update: data as never,
    });

    return api.ok({ ok: true });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Failed to update admin appeal detail.", { code: "PATCH_ADMIN_APPEAL_DETAIL_FAILED" });
  }
}
