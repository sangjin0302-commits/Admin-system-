import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { getContractTemplate } from "@/lib/docx/contract-templates";
import { generateContractDocx } from "@/lib/docx/generate";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.contract-docx.get");
  const { id: raw } = await context.params;
  const caseId = normalizeAdminEntityId(raw);
  if (!caseId) return api.error(400, "Invalid case id.", { code: "INVALID_CASE_ID" });

  const url = new URL(request.url);
  const templateKey = url.searchParams.get("template") ?? "SERVICE";
  const template = getContractTemplate(templateKey);
  if (!template) return api.error(400, "Invalid template.", { code: "INVALID_TEMPLATE" });

  const cm = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      title: true,
      caseNo: true,
      summary: true,
      contractDetail: { select: { contractSummary: true } },
      parties: { select: { name: true }, take: 1 }
    }
  });
  if (!cm) return api.error(404, "Not found", { code: "NOT_FOUND" });

  const today = new Date().toISOString().slice(0, 10);

  try {
    const buf = await generateContractDocx({
      template,
      variables: {
        scope: cm.contractDetail?.contractSummary ?? cm.summary ?? cm.title,
        startDate: today,
        endDate: "별도 협의",
        retainer: "협의",
        balance: "협의",
        fee: "협의"
      },
      clientName: cm.parties[0]?.name ?? "의뢰인",
      providerName: "에토스 행정사사무소",
      caseNo: cm.caseNo ?? undefined,
      date: today
    });

    return new Response(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="contract-${templateKey}-${cm.caseNo ?? caseId}.docx"`
      }
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "docx 생성 실패", { code: "DOCX_FAILED" });
  }
}
