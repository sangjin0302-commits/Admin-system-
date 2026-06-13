import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { generateGenericDocPdf } from "@/lib/pdf/generate";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.appeal-pdf.get");
  const { id: raw } = await context.params;
  const caseId = normalizeAdminEntityId(raw);
  if (!caseId) return api.error(400, "Invalid case id.", { code: "INVALID_CASE_ID" });

  const cm = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      title: true,
      caseNo: true,
      summary: true,
      adminAppealDetail: true,
      parties: { select: { name: true }, take: 1 }
    }
  });
  if (!cm) return api.error(404, "Not found", { code: "NOT_FOUND" });

  const ad = cm.adminAppealDetail;
  const sections = [
    {
      heading: "1. 청구인",
      body: `${cm.parties[0]?.name ?? "의뢰인"}`
    },
    {
      heading: "2. 피청구인 (처분청)",
      body: ad?.disposingAgency ?? "-"
    },
    {
      heading: "3. 처분 내용",
      body: ad?.dispositionContent ?? "(처분 내용 미입력)"
    },
    {
      heading: "4. 처분일 / 통지일",
      body: [
        ad?.dispositionDate ? `처분일: ${ad.dispositionDate.toISOString().slice(0, 10)}` : "",
        ad?.noticeReceivedDate ? `통지일: ${ad.noticeReceivedDate.toISOString().slice(0, 10)}` : "",
        ad?.filingDeadline ? `청구기한: ${ad.filingDeadline.toISOString().slice(0, 10)}` : ""
      ].filter(Boolean).join("\n")
    },
    {
      heading: "5. 청구 취지",
      body: "위 처분의 취소를 구합니다."
    },
    {
      heading: "6. 청구 이유",
      body: ad?.groundsSummary ?? "(청구 이유 미입력)"
    },
    {
      heading: "7. 증거",
      body: ad?.evidenceSummary ?? "(증거 자료 미입력)"
    },
    {
      heading: "8. 결과 보장의 한계",
      body: "본 청구의 결과는 재결청의 판단에 따라 결정됩니다."
    }
  ];

  try {
    const bytes = await generateGenericDocPdf({
      title: `행정심판 청구서 — ${cm.title}`,
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
        "Content-Disposition": `attachment; filename="appeal-${cm.caseNo ?? caseId}.pdf"`
      }
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "PDF 생성 실패", { code: "PDF_FAILED" });
  }
}
