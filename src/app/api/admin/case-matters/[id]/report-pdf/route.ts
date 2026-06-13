import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { generateGenericDocPdf } from "@/lib/pdf/generate";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.report-pdf.get");
  const { id: raw } = await context.params;
  const caseId = normalizeAdminEntityId(raw);
  if (!caseId) return api.error(400, "Invalid case id.", { code: "INVALID_CASE_ID" });

  const cm = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      title: true,
      caseNo: true,
      summary: true,
      contractDetail: true,
      parties: { select: { name: true }, take: 1 }
    }
  });
  if (!cm) return api.error(404, "Not found", { code: "NOT_FOUND" });

  const cd = cm.contractDetail;
  const sections = [
    { heading: "1. 조사 개요", body: cm.summary ?? "" },
    { heading: "2. 의뢰 내용", body: cd?.contractSummary ?? "" },
    { heading: "3. 분쟁 내용", body: cd?.disputeContent ?? "" },
    { heading: "4. 조사 범위", body: cd?.investigationScope ?? "" },
    { heading: "5. 주요 조사 결과", body: cd?.keyFindings ?? "현재까지 진행된 조사 결과는 추후 보강될 예정입니다." },
    { heading: "6. 법적 근거 요약", body: cd?.legalBasisSummary ?? "" },
    {
      heading: "7. 한계 및 유의사항",
      body:
        "본 보고서는 사실관계 정리 및 자료 검토 결과이며, 최종 판단은 관할 기관 및 법원의 결정에 따릅니다."
    }
  ];

  try {
    const bytes = await generateGenericDocPdf({
      title: `사실조사 보고서 — ${cm.title}`,
      clientName: cm.parties[0]?.name ?? "의뢰인",
      caseNo: cm.caseNo ?? undefined,
      date: new Date().toISOString().slice(0, 10),
      sections,
      signature: "에토스 행정사사무소"
    });

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${cm.caseNo ?? caseId}.pdf"`
      }
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "PDF 생성 실패", { code: "PDF_FAILED" });
  }
}
