import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.contract-detail.patch");
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
      contractType: typeof body.contractType === "string" ? body.contractType : undefined,
      counterpartyName: typeof body.counterpartyName === "string" ? body.counterpartyName || null : undefined,
      counterpartyContact: typeof body.counterpartyContact === "string" ? body.counterpartyContact || null : undefined,
      contractDate: typeof body.contractDate === "string" ? (body.contractDate ? new Date(body.contractDate) : null) : undefined,
      contractAmount: typeof body.contractAmount === "number" ? body.contractAmount : undefined,
      contractSummary: typeof body.contractSummary === "string" ? body.contractSummary || null : undefined,
      disputeContent: typeof body.disputeContent === "string" ? body.disputeContent || null : undefined,
      investigationStatus: typeof body.investigationStatus === "string" ? body.investigationStatus : undefined,
      investigationScope: typeof body.investigationScope === "string" ? body.investigationScope || null : undefined,
      reportDueDate: typeof body.reportDueDate === "string" ? (body.reportDueDate ? new Date(body.reportDueDate) : null) : undefined,
      reportDeliveredAt: typeof body.reportDeliveredAt === "string" ? (body.reportDeliveredAt ? new Date(body.reportDeliveredAt) : null) : undefined,
      keyFindings: typeof body.keyFindings === "string" ? body.keyFindings || null : undefined,
      legalBasisSummary: typeof body.legalBasisSummary === "string" ? body.legalBasisSummary || null : undefined,
    };

    await prisma.contractInvestigationDetail.upsert({
      where: { caseId: caseMatterId },
      create: { caseId: caseMatterId, ...data } as never,
      update: data as never,
    });

    return api.ok({ ok: true });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Failed to update contract detail.", { code: "PATCH_CONTRACT_DETAIL_FAILED" });
  }
}
