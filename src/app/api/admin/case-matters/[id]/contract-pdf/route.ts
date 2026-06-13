import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { generateContractPdf } from "@/lib/pdf/generate";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.contract-pdf.get");
  const { id: rawCaseId } = await context.params;
  const caseId = normalizeAdminEntityId(rawCaseId);
  if (!caseId) return api.error(400, "Invalid case id.", { code: "INVALID_CASE_ID" });

  const cm = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      title: true,
      caseNo: true,
      summary: true,
      category: true,
      parties: { select: { name: true, role: true }, take: 1 },
      contractDetail: { select: { contractType: true, contractSummary: true, contractDate: true } }
    }
  });
  if (!cm) return api.error(404, "Case matter not found.", { code: "NOT_FOUND" });

  const clientName = cm.parties[0]?.name ?? "의뢰인";
  const today = new Date().toISOString().slice(0, 10);

  const sections = [
    { heading: "1. 사건 개요", body: cm.summary ?? "내용 없음." },
    { heading: "2. 의뢰 내용", body: cm.contractDetail?.contractSummary ?? "상세 내용은 별도 협의에 따릅니다." },
    {
      heading: "3. 진행 방식",
      body:
        "1) 사실관계 확인\n2) 자료 수집·분석\n3) 검토 및 정리\n4) 결과 보고\n사안의 복잡도에 따라 단계가 조정될 수 있습니다."
    },
    {
      heading: "4. 결과 보장의 한계",
      body:
        "본 위임의 결과는 관할 기관의 판단에 따라 결정되며, 사무소는 결과를 보장하지 않습니다. 절차의 정확성과 사실관계 정리에 최선을 다합니다."
    }
  ];

  try {
    const bytes = await generateContractPdf({
      title: cm.title,
      clientName,
      caseNo: cm.caseNo ?? undefined,
      date: today,
      sections,
      signature: "에토스 행정사사무소"
    });

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="contract-${cm.caseNo ?? caseId}.pdf"`
      }
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "PDF 생성에 실패했습니다.", { code: "PDF_GENERATION_FAILED" });
  }
}
