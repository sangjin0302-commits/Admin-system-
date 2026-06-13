import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.license-detail.patch");
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
      permitType: typeof body.permitType === "string" ? body.permitType : undefined,
      targetAgency: typeof body.targetAgency === "string" ? body.targetAgency || null : undefined,
      applicationNo: typeof body.applicationNo === "string" ? body.applicationNo || null : undefined,
      businessName: typeof body.businessName === "string" ? body.businessName || null : undefined,
      businessAddress: typeof body.businessAddress === "string" ? body.businessAddress || null : undefined,
      applicationDate: typeof body.applicationDate === "string" ? (body.applicationDate ? new Date(body.applicationDate) : null) : undefined,
      reviewDeadline: typeof body.reviewDeadline === "string" ? (body.reviewDeadline ? new Date(body.reviewDeadline) : null) : undefined,
      approvalDate: typeof body.approvalDate === "string" ? (body.approvalDate ? new Date(body.approvalDate) : null) : undefined,
      expiryDate: typeof body.expiryDate === "string" ? (body.expiryDate ? new Date(body.expiryDate) : null) : undefined,
      stage: typeof body.stage === "string" ? body.stage : undefined,
      requirementsSummary: typeof body.requirementsSummary === "string" ? body.requirementsSummary || null : undefined,
      missingRequirements: typeof body.missingRequirements === "string" ? body.missingRequirements || null : undefined,
      supplementContent: typeof body.supplementContent === "string" ? body.supplementContent || null : undefined,
      supplementDueDate: typeof body.supplementDueDate === "string" ? (body.supplementDueDate ? new Date(body.supplementDueDate) : null) : undefined,
      conditionsSummary: typeof body.conditionsSummary === "string" ? body.conditionsSummary || null : undefined,
    };

    await prisma.licensePermitDetail.upsert({
      where: { caseId: caseMatterId },
      create: { caseId: caseMatterId, ...data } as never,
      update: data as never,
    });

    return api.ok({ ok: true });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Failed to update license detail.", { code: "PATCH_LICENSE_DETAIL_FAILED" });
  }
}
